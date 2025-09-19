use std::collections::HashSet;

use mindrig_types::{
    ParseResult, ParseResultError, ParseResultErrorStateError, ParseResultSuccess,
    ParseResultSuccessStateSuccess, Prompt, PromptVar, Span, SpanShape,
};
use oxc_allocator::Allocator;
use oxc_allocator::Vec as OxcVec;
use oxc_ast::{Comment, Visit, ast::*};
use oxc_parser::{ParseOptions, Parser};
use oxc_span::{GetSpan, SourceType};

use crate::comment;

struct PromptVisitor<'a> {
    /// Source code being analyzed.
    code: &'a str,
    /// Source code file path.
    file: String,
    /// Collected prompts.
    prompts: Vec<Prompt>,
    /// Stack of identifier sets with prompt annotations.
    prompt_idents_stack: Vec<HashSet<String>>,
    /// Parsed comments.
    comments: &'a OxcVec<'a, Comment>,
    /// Cursor to track position in comments vector.
    comment_cursor: usize,
}

impl<'a> PromptVisitor<'a> {
    fn new(code: &'a str, file: String, comments: &'a OxcVec<'a, Comment>) -> Self {
        Self {
            code,
            file,
            prompts: Vec::new(),
            prompt_idents_stack: vec![HashSet::new()],
            comments,
            comment_cursor: 0,
        }
    }

    fn span_outer(&self, span: &oxc_span::Span) -> Span {
        Span {
            start: span.start,
            end: span.end,
        }
    }

    fn span_shape_literal(&self, span: &oxc_span::Span) -> SpanShape {
        let outer = self.span_outer(span);
        let inner_start = outer.start.saturating_add(1);
        let inner_end = outer.end.saturating_sub(1);
        let inner = Span {
            start: inner_start,
            end: inner_end,
        };
        SpanShape { outer, inner }
    }

    fn process_variable_declarator(
        &mut self,
        declarator: &VariableDeclarator<'a>,
        prompt_comment: Option<&'a Comment>,
    ) {
        if let BindingPatternKind::BindingIdentifier(ident) = &declarator.id.kind {
            if prompt_comment.is_some() {
                if let Some(scope) = self.prompt_idents_stack.last_mut() {
                    scope.insert(ident.name.to_string());
                }
            }
        }

        if let Some(init) = &declarator.init {
            if let BindingPatternKind::BindingIdentifier(ident) = &declarator.id.kind {
                match init {
                    Expression::TemplateLiteral(template) => {
                        self.process_template_literal(&ident.name, template);
                    }

                    Expression::StringLiteral(string_literal) => {
                        self.process_string_literal(&ident.name, string_literal);
                    }

                    _ => {}
                }
            }
        }
    }

    fn process_assignment_expression(&mut self, expr: &AssignmentExpression<'a>) {
        if let AssignmentTarget::AssignmentTargetIdentifier(ident) = &expr.left {
            match &expr.right {
                Expression::TemplateLiteral(template) => {
                    self.process_template_literal(&ident.name, template);
                }

                Expression::StringLiteral(string_literal) => {
                    self.process_string_literal(&ident.name, string_literal);
                }

                _ => {}
            }
        }
    }

    fn extract_template_vars(&self, template: &TemplateLiteral<'a>) -> Vec<PromptVar> {
        let mut vars = Vec::new();

        for expr in &template.expressions {
            let expr_span = expr.span();
            let mut start = expr_span.start.saturating_sub(2);
            let mut end = expr_span.end + 1;

            // Validate we actually have a "${" before and a "}" after; otherwise fallback
            let code_bytes = self.code.as_bytes();
            let valid = (start as usize + 1) < code_bytes.len()
                && (end as usize) <= code_bytes.len()
                && &self.code[start as usize..(start + 2) as usize] == "${"
                && code_bytes[(end - 1) as usize] == b'}';

            if !valid {
                start = expr_span.start;
                end = expr_span.end;
            }

            let exp = &self.code[start as usize..end as usize];
            let outer = Span { start, end };
            let inner = Span {
                start: expr_span.start,
                end: expr_span.end,
            };
            vars.push(PromptVar {
                exp: exp.to_string(),
                span: SpanShape { outer, inner },
            });
        }

        vars
    }

    fn get_template_text(&self, template: &TemplateLiteral<'a>) -> String {
        template.span().source_text(self.code).to_string()
    }

    fn process_template_literal(&mut self, ident_name: &str, template: &TemplateLiteral<'a>) {
        let prompt_comment = self.find_prompt_comment(&template.span());

        if self.is_prompt(ident_name, prompt_comment) {
            let prompt = Prompt {
                file: self.file.clone(),
                span: self.span_shape_literal(&template.span),
                exp: self.get_template_text(template),
                vars: self.extract_template_vars(template),
            };
            self.prompts.push(prompt);
        }
    }

    fn process_string_literal(&mut self, ident_name: &str, string: &StringLiteral<'a>) {
        let prompt_comment = self.find_prompt_comment(&string.span());

        if self.is_prompt(ident_name, prompt_comment) {
            let prompt = Prompt {
                file: self.file.clone(),
                span: self.span_shape_literal(&string.span),
                exp: string.span().source_text(self.code).to_string(),
                vars: Vec::new(),
            };
            self.prompts.push(prompt);
        }
    }

    fn is_prompt(&self, ident_name: &str, prompt_comment: Option<&'a Comment>) -> bool {
        if ident_name.to_lowercase().contains("prompt") || prompt_comment.is_some() {
            return true;
        }

        for scope in self.prompt_idents_stack.iter().rev() {
            if scope.contains(ident_name) {
                return true;
            }
        }

        false
    }

    fn find_prompt_comment(&mut self, node_span: &oxc_span::Span) -> Option<&'a Comment> {
        let mut prompt_comment = None;

        while self.comment_cursor < self.comments.len() {
            let comment = &self.comments[self.comment_cursor];

            // We're past the node span.
            if comment.span.start >= node_span.start {
                break;
            }

            // Check if this is a prompt comment
            let comment_text = comment.content_span().source_text(self.code);
            if let Some(is_prompt_comment) = comment::parse_comment(comment_text) {
                if is_prompt_comment {
                    prompt_comment = Some(comment);
                } else {
                    prompt_comment = None;
                }
            }

            self.comment_cursor += 1;
        }

        prompt_comment
    }
}

impl<'a> Visit<'a> for PromptVisitor<'a> {
    fn enter_node(&mut self, kind: oxc_ast::AstKind<'a>) {
        let prompt_comment = self.find_prompt_comment(&kind.span());

        match kind {
            oxc_ast::AstKind::Function(_) | oxc_ast::AstKind::ArrowFunctionExpression(_) => {
                self.prompt_idents_stack.push(HashSet::new());
            }

            oxc_ast::AstKind::VariableDeclaration(decl) => {
                for declarator in &decl.declarations {
                    self.process_variable_declarator(declarator, prompt_comment);
                }
            }

            oxc_ast::AstKind::AssignmentExpression(expr) => {
                self.process_assignment_expression(expr);
            }

            _ => {}
        }
    }

    fn leave_node(&mut self, kind: oxc_ast::AstKind<'a>) {
        match kind {
            oxc_ast::AstKind::Function(_) | oxc_ast::AstKind::ArrowFunctionExpression(_) => {
                self.prompt_idents_stack.pop();
            }
            _ => {}
        }
    }
}

pub fn parse_prompts_ts(source: &str, filename: &str) -> ParseResult {
    let allocator = Allocator::default();

    let source_type =
        SourceType::from_path(filename).unwrap_or(SourceType::default().with_typescript(true));

    let parser_return = Parser::new(&allocator, source, source_type)
        .with_options(ParseOptions::default())
        .parse();

    if !parser_return.errors.is_empty() {
        let error_messages: Vec<String> = parser_return
            .errors
            .iter()
            .map(|e| format!("{}", e))
            .collect();

        return ParseResult::ParseResultError(ParseResultError {
            state: ParseResultErrorStateError,
            error: error_messages.join("; "),
        });
    }

    let mut visitor = PromptVisitor::new(
        source,
        filename.to_string(),
        &parser_return.program.comments,
    );
    visitor.visit_program(&parser_return.program);

    ParseResult::ParseResultSuccess(ParseResultSuccess {
        state: ParseResultSuccessStateSuccess,
        prompts: visitor.prompts,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test::*;
    use indoc::indoc;
    use insta::assert_debug_snapshot;

    #[test]
    fn detect_const_name() {
        let const_src = r#"const userPrompt = "You are a helpful assistant.";"#;
        assert_debug_snapshot!(parse_prompts_ts(const_src, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        span: SpanShape {
                            outer: Span {
                                start: 19,
                                end: 49,
                            },
                            inner: Span {
                                start: 20,
                                end: 48,
                            },
                        },
                        exp: "\"You are a helpful assistant.\"",
                        vars: [],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn detect_let_name() {
        let var_src = r#"var userPrompt = "You are a helpful assistant.";"#;
        assert_debug_snapshot!(parse_prompts_ts(var_src, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        span: SpanShape {
                            outer: Span {
                                start: 17,
                                end: 47,
                            },
                            inner: Span {
                                start: 18,
                                end: 46,
                            },
                        },
                        exp: "\"You are a helpful assistant.\"",
                        vars: [],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn detect_var_name() {
        let var_src = r#"var userPrompt = "You are a helpful assistant.";"#;
        assert_debug_snapshot!(parse_prompts_ts(var_src, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        span: SpanShape {
                            outer: Span {
                                start: 17,
                                end: 47,
                            },
                            inner: Span {
                                start: 18,
                                end: 46,
                            },
                        },
                        exp: "\"You are a helpful assistant.\"",
                        vars: [],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn detect_inline() {
        let inline_src = r#"const greeting = /* @prompt */ `Welcome ${user}!`;"#;
        assert_debug_snapshot!(parse_prompts_ts(inline_src, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        span: SpanShape {
                            outer: Span {
                                start: 31,
                                end: 49,
                            },
                            inner: Span {
                                start: 32,
                                end: 48,
                            },
                        },
                        exp: "`Welcome ${user}!`",
                        vars: [
                            PromptVar {
                                exp: "${user}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 40,
                                        end: 47,
                                    },
                                    inner: Span {
                                        start: 42,
                                        end: 46,
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn detect_inline_jsdoc() {
        let inline_jsdoc_src = r#"const msg = /** @prompt */ "Hello world";"#;
        assert_debug_snapshot!(parse_prompts_ts(inline_jsdoc_src, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        span: SpanShape {
                            outer: Span {
                                start: 27,
                                end: 40,
                            },
                            inner: Span {
                                start: 28,
                                end: 39,
                            },
                        },
                        exp: "\"Hello world\"",
                        vars: [],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn detect_inline_dirty() {
        let inline_dirty_src = r#"const greeting = /* @prompt greeting */ `Welcome ${user}!`;"#;
        assert_prompts_size(parse_prompts_ts(inline_dirty_src, "prompts.ts"), 1)
    }

    #[test]
    fn detect_inline_none() {
        let inline_none_src = r#"const greeting = /* @prompting */ `Welcome ${user}!`;
const whatever = /* wrong@prompt */ "That's not it!";"#;
        assert_prompts_size(parse_prompts_ts(inline_none_src, "prompts.ts"), 0)
    }

    #[test]
    fn detect_var_comment() {
        let var_comment_src = indoc! {r#"
            // @prompt
            const hello = `Hello, world!`;
        "#};
        assert_debug_snapshot!(parse_prompts_ts(var_comment_src, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        span: SpanShape {
                            outer: Span {
                                start: 25,
                                end: 40,
                            },
                            inner: Span {
                                start: 26,
                                end: 39,
                            },
                        },
                        exp: "`Hello, world!`",
                        vars: [],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn detect_var_inline() {
        let var_comment_src = indoc! {r#"
            /* @prompt */
            const hello = `Hello, world!`;
        "#};
        assert_debug_snapshot!(parse_prompts_ts(var_comment_src, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        span: SpanShape {
                            outer: Span {
                                start: 28,
                                end: 43,
                            },
                            inner: Span {
                                start: 29,
                                end: 42,
                            },
                        },
                        exp: "`Hello, world!`",
                        vars: [],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn detect_var_jsdoc() {
        let var_jsdoc_src = indoc! {r#"
            /** @prompt */
            const hello = `Hello, world!`;
        "#};
        assert_debug_snapshot!(parse_prompts_ts(var_jsdoc_src, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        span: SpanShape {
                            outer: Span {
                                start: 29,
                                end: 44,
                            },
                            inner: Span {
                                start: 30,
                                end: 43,
                            },
                        },
                        exp: "`Hello, world!`",
                        vars: [],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn detect_var_comment_spaced() {
        let var_comment_src = indoc! {r#"
            // @prompt


            const hello = `Hello, world!`;

            // @prompt
            nope()

            const world = "Hello!";
        "#};
        assert_debug_snapshot!(parse_prompts_ts(var_comment_src, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        span: SpanShape {
                            outer: Span {
                                start: 27,
                                end: 42,
                            },
                            inner: Span {
                                start: 28,
                                end: 41,
                            },
                        },
                        exp: "`Hello, world!`",
                        vars: [],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn detect_var_comment_mixed() {
        let var_comment_mixed_src = indoc! {r#"
            // @prompt
            const number = 42;

            const hello = "Hello, world!"
        "#};
        let var_comment_mixed_result = parse_prompts_ts(var_comment_mixed_src, "prompts.ts");
        assert_prompts_size(var_comment_mixed_result, 0);
    }

    #[test]
    fn detect_var_comment_mixed_nested() {
        let var_comment_mixed_nested_src = indoc! {r#"
            class Hello {
                world(self) {
                    // @prompt
                    let hello = 42;

                    // @prompt
                    let hi = 42;

                    hi = "Hi!"
                }
            }

            hello = "Hello, world!";
        "#};
        let var_comment_mixed_nested_result =
            parse_prompts_ts(var_comment_mixed_nested_src, "prompts.ts");
        assert_prompts_size(var_comment_mixed_nested_result, 1);
    }

    #[test]
    fn detect_var_comment_none() {
        let var_comment_none_src = r#"// @prompting
const hello = `Hello, world!`;"#;
        assert_prompts_size(parse_prompts_ts(var_comment_none_src, "prompts.ts"), 0)
    }

    #[test]
    fn detect_multi() {
        let multi_src = indoc! {r#"
            const userPrompt = `Hello, ${name}!`;
            const greeting = /* @prompt */ `Welcome ${user}!`;
            // @prompt
            const farewell = `Goodbye ${user.name}!`;
            /** @prompt */
            const system = "You are an AI assistant";
            const regular = `Not a prompt ${value}`;
        "#};
        assert_debug_snapshot!(parse_prompts_ts(multi_src, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        span: SpanShape {
                            outer: Span {
                                start: 19,
                                end: 36,
                            },
                            inner: Span {
                                start: 20,
                                end: 35,
                            },
                        },
                        exp: "`Hello, ${name}!`",
                        vars: [
                            PromptVar {
                                exp: "${name}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 27,
                                        end: 34,
                                    },
                                    inner: Span {
                                        start: 29,
                                        end: 33,
                                    },
                                },
                            },
                        ],
                    },
                    Prompt {
                        file: "prompts.ts",
                        span: SpanShape {
                            outer: Span {
                                start: 69,
                                end: 87,
                            },
                            inner: Span {
                                start: 70,
                                end: 86,
                            },
                        },
                        exp: "`Welcome ${user}!`",
                        vars: [
                            PromptVar {
                                exp: "${user}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 78,
                                        end: 85,
                                    },
                                    inner: Span {
                                        start: 80,
                                        end: 84,
                                    },
                                },
                            },
                        ],
                    },
                    Prompt {
                        file: "prompts.ts",
                        span: SpanShape {
                            outer: Span {
                                start: 117,
                                end: 140,
                            },
                            inner: Span {
                                start: 118,
                                end: 139,
                            },
                        },
                        exp: "`Goodbye ${user.name}!`",
                        vars: [
                            PromptVar {
                                exp: "${user.name}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 126,
                                        end: 138,
                                    },
                                    inner: Span {
                                        start: 128,
                                        end: 137,
                                    },
                                },
                            },
                        ],
                    },
                    Prompt {
                        file: "prompts.ts",
                        span: SpanShape {
                            outer: Span {
                                start: 172,
                                end: 197,
                            },
                            inner: Span {
                                start: 173,
                                end: 196,
                            },
                        },
                        exp: "\"You are an AI assistant\"",
                        vars: [],
                    },
                ],
            },
        )
        "#);
    }

    #[test]
    fn detect_assign_var_comment() {
        let assign_var_comment_src = indoc! {r#"
            // @prompt
            let hello;
            hello = `Assigned ${value}`;
        "#};
        assert_debug_snapshot!(parse_prompts_ts(assign_var_comment_src, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        span: SpanShape {
                            outer: Span {
                                start: 30,
                                end: 49,
                            },
                            inner: Span {
                                start: 31,
                                end: 48,
                            },
                        },
                        exp: "`Assigned ${value}`",
                        vars: [
                            PromptVar {
                                exp: "${value}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 40,
                                        end: 48,
                                    },
                                    inner: Span {
                                        start: 42,
                                        end: 47,
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn detect_reassign_var_comment() {
        let reassign_var_comment = indoc! {r#"
            // @prompt
            let hello;
            hello = 123;

            hello = `Assigned ${value}`;
        "#};
        assert_debug_snapshot!(parse_prompts_ts(
            reassign_var_comment,
            "prompts.ts"
        ), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        span: SpanShape {
                            outer: Span {
                                start: 44,
                                end: 63,
                            },
                            inner: Span {
                                start: 45,
                                end: 62,
                            },
                        },
                        exp: "`Assigned ${value}`",
                        vars: [
                            PromptVar {
                                exp: "${value}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 54,
                                        end: 62,
                                    },
                                    inner: Span {
                                        start: 56,
                                        end: 61,
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
        )
        "#);
    }

    #[test]
    fn detect_none() {
        let no_prompts_src = indoc! {r#"
            const regularTemplate = `This is not a ${value}`;
            const normalString = "This is not special";
            const regular = `Regular template with ${variable}`;
            const message = "Just a message";
            // @prompt
            const number = 1;
        "#};
        assert_prompts_size(parse_prompts_ts(no_prompts_src, "prompts.ts"), 0);
    }

    #[test]
    fn detect_single_var() {
        let single_var_src = r#"const userPrompt = `Hello, ${name}!`;"#;
        assert_debug_snapshot!(parse_prompts_ts(single_var_src, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        span: SpanShape {
                            outer: Span {
                                start: 19,
                                end: 36,
                            },
                            inner: Span {
                                start: 20,
                                end: 35,
                            },
                        },
                        exp: "`Hello, ${name}!`",
                        vars: [
                            PromptVar {
                                exp: "${name}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 27,
                                        end: 34,
                                    },
                                    inner: Span {
                                        start: 29,
                                        end: 33,
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn detect_multi_vars() {
        let multi_vars_src =
            r#"const userPrompt = `Hello, ${name}! How is the weather today in ${city}?`;"#;
        assert_debug_snapshot!(parse_prompts_ts(multi_vars_src, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        span: SpanShape {
                            outer: Span {
                                start: 19,
                                end: 73,
                            },
                            inner: Span {
                                start: 20,
                                end: 72,
                            },
                        },
                        exp: "`Hello, ${name}! How is the weather today in ${city}?`",
                        vars: [
                            PromptVar {
                                exp: "${name}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 27,
                                        end: 34,
                                    },
                                    inner: Span {
                                        start: 29,
                                        end: 33,
                                    },
                                },
                            },
                            PromptVar {
                                exp: "${city}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 64,
                                        end: 71,
                                    },
                                    inner: Span {
                                        start: 66,
                                        end: 70,
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn parse_exp_vars() {
        let exp_vars_src = r#"const userPrompt = `Hello, ${user.name}! How is the weather today in ${user.location.city}?`;"#;
        assert_debug_snapshot!(parse_prompts_ts(exp_vars_src, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        span: SpanShape {
                            outer: Span {
                                start: 19,
                                end: 92,
                            },
                            inner: Span {
                                start: 20,
                                end: 91,
                            },
                        },
                        exp: "`Hello, ${user.name}! How is the weather today in ${user.location.city}?`",
                        vars: [
                            PromptVar {
                                exp: "${user.name}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 27,
                                        end: 39,
                                    },
                                    inner: Span {
                                        start: 29,
                                        end: 38,
                                    },
                                },
                            },
                            PromptVar {
                                exp: "${user.location.city}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 69,
                                        end: 90,
                                    },
                                    inner: Span {
                                        start: 71,
                                        end: 89,
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn parse_exp_vars_complex() {
        let exp_vars_src =
            r#"const userPrompt = `Hello, ${User.fullName({ ...user.name, last: null })}!`;"#;
        assert_debug_snapshot!(parse_prompts_ts(exp_vars_src, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        span: SpanShape {
                            outer: Span {
                                start: 19,
                                end: 75,
                            },
                            inner: Span {
                                start: 20,
                                end: 74,
                            },
                        },
                        exp: "`Hello, ${User.fullName({ ...user.name, last: null })}!`",
                        vars: [
                            PromptVar {
                                exp: "${User.fullName({ ...user.name, last: null })}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 27,
                                        end: 73,
                                    },
                                    inner: Span {
                                        start: 29,
                                        end: 72,
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn handle_invalid_syntax() {
        let invalid_src = r#"const invalid = `unclosed template"#;
        assert_debug_snapshot!(parse_prompts_ts(invalid_src, "prompts.ts"), @r#"
        ParseResultError(
            ParseResultError {
                state: "error",
                error: "Unterminated string",
            },
        )
        "#);
    }

    #[test]
    fn parse_js_code() {
        let js_src = r#"const prompt = /* @prompt */ `Hello ${world}!`;"#;
        assert_debug_snapshot!(parse_prompts_ts(js_src, "test.js"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "test.js",
                        span: SpanShape {
                            outer: Span {
                                start: 29,
                                end: 46,
                            },
                            inner: Span {
                                start: 30,
                                end: 45,
                            },
                        },
                        exp: "`Hello ${world}!`",
                        vars: [
                            PromptVar {
                                exp: "${world}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 36,
                                        end: 44,
                                    },
                                    inner: Span {
                                        start: 38,
                                        end: 43,
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn parse_jsx_code() {
        let jsx_src = indoc! {r#"
            const prompt = /* @prompt */ `Hello ${world}!`;
            const element = <div>{prompt}</div>;
        "#};
        assert_debug_snapshot!(parse_prompts_ts(jsx_src, "test.jsx"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "test.jsx",
                        span: SpanShape {
                            outer: Span {
                                start: 29,
                                end: 46,
                            },
                            inner: Span {
                                start: 30,
                                end: 45,
                            },
                        },
                        exp: "`Hello ${world}!`",
                        vars: [
                            PromptVar {
                                exp: "${world}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 36,
                                        end: 44,
                                    },
                                    inner: Span {
                                        start: 38,
                                        end: 43,
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn parse_ts_code() {
        let ts_src = r#"const prompt : string = /* @prompt */ `Hello ${world}!`;"#;
        assert_debug_snapshot!(parse_prompts_ts(ts_src, "test.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "test.ts",
                        span: SpanShape {
                            outer: Span {
                                start: 38,
                                end: 55,
                            },
                            inner: Span {
                                start: 39,
                                end: 54,
                            },
                        },
                        exp: "`Hello ${world}!`",
                        vars: [
                            PromptVar {
                                exp: "${world}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 45,
                                        end: 53,
                                    },
                                    inner: Span {
                                        start: 47,
                                        end: 52,
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn parse_tsx_code() {
        let tsx_src = indoc! {r#"
            const prompt : string = /* @prompt */ `Hello ${world}!`;
            const element = <div>{prompt}</div>;
        "#};
        assert_debug_snapshot!(parse_prompts_ts(tsx_src, "test.tsx"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "test.tsx",
                        span: SpanShape {
                            outer: Span {
                                start: 38,
                                end: 55,
                            },
                            inner: Span {
                                start: 39,
                                end: 54,
                            },
                        },
                        exp: "`Hello ${world}!`",
                        vars: [
                            PromptVar {
                                exp: "${world}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 45,
                                        end: 53,
                                    },
                                    inner: Span {
                                        start: 47,
                                        end: 52,
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn parse_spans_str() {
        let span_str_src = indoc! {r#"
            const systemPrompt = "You are a helpful assistant.";
        "#};
        let span_str_result = parse_prompts_ts(span_str_src, "prompts.ts");
        assert_prompt_spans(span_str_src, span_str_result);
    }

    #[test]
    fn parse_spans_tmpl() {
        let span_tmpl_src = indoc! {r#"
            const userPrompt = `Hello, ${name}! How is the weather today in ${city}?`;
        "#};
        let span_tmpl_result = parse_prompts_ts(span_tmpl_src, "prompts.ts");
        assert_prompt_spans(span_tmpl_src, span_tmpl_result);
    }

    #[test]
    fn parse_nested() {
        let nested_src = indoc! {r#"
            class Hello {
                world(self) {
                    const fn = () => {
                        const helloPrompt = `Hello, ${name}!`;

                        // @prompt
                        const alsoPrmpt = "Hi!";
                    };

                    return fn;
                }
            }
        "#};
        assert_debug_snapshot!(parse_prompts_ts(nested_src, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        span: SpanShape {
                            outer: Span {
                                start: 91,
                                end: 108,
                            },
                            inner: Span {
                                start: 92,
                                end: 107,
                            },
                        },
                        exp: "`Hello, ${name}!`",
                        vars: [
                            PromptVar {
                                exp: "${name}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 99,
                                        end: 106,
                                    },
                                    inner: Span {
                                        start: 101,
                                        end: 105,
                                    },
                                },
                            },
                        ],
                    },
                    Prompt {
                        file: "prompts.ts",
                        span: SpanShape {
                            outer: Span {
                                start: 164,
                                end: 169,
                            },
                            inner: Span {
                                start: 165,
                                end: 168,
                            },
                        },
                        exp: "\"Hi!\"",
                        vars: [],
                    },
                ],
            },
        )
        "#)
    }
}
