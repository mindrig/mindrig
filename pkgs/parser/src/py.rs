use std::collections::HashSet;

use mindrig_types::*;
use ruff_python_ast as ast;
use ruff_python_ast::visitor::{self, Visitor};
use ruff_python_parser::{self as parser, TokenKind};
use ruff_text_size::{Ranged, TextRange};

use crate::comment;

struct PyParser {}

impl PyParser {
    fn parse_comments(source: &str, parsed: &parser::Parsed<ast::ModModule>) -> Vec<TextRange> {
        let mut comments: Vec<TextRange> = Vec::new();

        for token in parsed.tokens() {
            let kind = token.kind();
            let range = token.range();
            match kind {
                TokenKind::Comment => {
                    let chunk = &source[range];
                    if comment::parse_comment(chunk).unwrap_or(false) {
                        comments.push(range);
                    }
                }

                _ => {}
            }
        }
        comments
    }
}

struct PyPromptVisitor<'a> {
    /// Source code being analyzed.
    code: &'a str,
    /// Source code file path.
    file: String,
    /// Collected prompts.
    prompts: Vec<Prompt>,
    /// Stack of identifiers that have prompt annotations.
    prompt_idents_stack: Vec<HashSet<String>>,
    /// Comment markers sorted by start (only real line comments with @prompt).
    comments: Vec<TextRange>,
    /// Cursor to track position in comments array.
    comment_cursor: usize,
}

impl<'a> PyPromptVisitor<'a> {
    fn new(code: &'a str, file: String, comments: Vec<TextRange>) -> Self {
        Self {
            code,
            file,
            prompts: Vec::new(),
            prompt_idents_stack: vec![HashSet::new()],
            comments,
            comment_cursor: 0,
        }
    }

    fn span(&self, range: TextRange) -> Span {
        Span {
            start: range.start().to_usize() as u32,
            end: range.end().to_usize() as u32,
        }
    }

    fn span_shape_string_like(&self, range: TextRange) -> SpanShape {
        // Python strings may have prefixes like f, r, u, fr, etc., and
        // single/double/triple quotes. Compute inner by finding opening quote
        // and matching its length (1 or 3 characters).
        let bytes = self.code.as_bytes();
        let start = range.start().to_usize();
        let end = range.end().to_usize();

        // Find first quote character from start.
        let mut i = start;
        while i < end {
            let c = bytes[i];
            if c == b'\'' || c == b'\"' {
                break;
            }
            i += 1;
        }

        let quote_pos = i;
        let quote_char = if quote_pos < end {
            bytes[quote_pos]
        } else {
            b'\''
        };
        let mut quote_len = 1u32;
        if quote_pos + 2 < end
            && bytes[quote_pos + 1] == quote_char
            && bytes[quote_pos + 2] == quote_char
        {
            quote_len = 3;
        }

        let outer = self.span(range);
        let inner_start = (quote_pos as u32).saturating_add(quote_len);
        let inner_end = outer.end.saturating_sub(quote_len);
        let inner = Span {
            start: inner_start,
            end: inner_end,
        };

        SpanShape { outer, inner }
    }

    fn parse_fstr_vars(&self, fstr: &ast::ExprFString) -> Vec<PromptVar> {
        let mut vars: Vec<PromptVar> = Vec::new();
        for part in fstr.value.as_slice() {
            if let ast::FStringPart::FString(inner) = part {
                for element in &inner.elements {
                    if let ast::InterpolatedStringElement::Interpolation(interp) = element {
                        let range = interp.range();
                        vars.push(PromptVar {
                            exp: self.code[range].to_string(),
                            span: SpanShape {
                                outer: self.span(range),
                                inner: Span {
                                    start: self.span(range).start + 1,
                                    end: self.span(range).end.saturating_sub(1),
                                },
                            },
                        });
                    }
                }
            }
        }
        vars
    }

    fn parse_tstr_vars(&self, tstr: &ast::ExprTString) -> Vec<PromptVar> {
        let mut vars: Vec<PromptVar> = Vec::new();
        for element in tstr.value.elements() {
            if let ast::InterpolatedStringElement::Interpolation(interp) = element {
                let r = interp.range();
                vars.push(PromptVar {
                    exp: self.code[r].to_string(),
                    span: SpanShape {
                        outer: self.span(r),
                        inner: Span {
                            start: self.span(r).start + 1,
                            end: self.span(r).end.saturating_sub(1),
                        },
                    },
                });
            }
        }
        vars
    }

    fn process_assign_target(
        &mut self,
        is_prompt: bool,
        target: &ast::Expr,
        val: Option<&ast::Expr>,
    ) {
        match &target {
            ast::Expr::Name(name_expr) => {
                self.process_assign(is_prompt, name_expr, val);
            }

            ast::Expr::Tuple(ast::ExprTuple { elts: idents, .. })
            | ast::Expr::List(ast::ExprList { elts: idents, .. }) => match val {
                Some(ast::Expr::Tuple(ast::ExprTuple { elts: vals, .. }))
                | Some(ast::Expr::List(ast::ExprList { elts: vals, .. })) => {
                    self.process_assigns(is_prompt, idents, Some(vals));
                }

                None => {
                    self.process_assigns(is_prompt, idents, None);
                }

                _ => {}
            },

            _ => {}
        }
    }

    fn process_assigns(
        &mut self,
        is_prompt: bool,
        idents: &Vec<ast::Expr>,
        vals: Option<&Vec<ast::Expr>>,
    ) {
        let vals = vals.as_ref();
        for (i, ident) in idents.iter().enumerate() {
            if let ast::Expr::Name(ident) = ident {
                self.process_assign(is_prompt, ident, vals.and_then(|v| v.get(i)));
            }
        }
    }

    fn process_assign(&mut self, is_prompt: bool, name: &ast::ExprName, val: Option<&ast::Expr>) {
        let ident = name.id.as_str();

        if is_prompt {
            self.push_prompt_ident(ident);
        }

        if let Some(val) = val {
            match val {
                ast::Expr::FString(expr) => self.process_fstr(ident, expr),
                ast::Expr::StringLiteral(expr) => self.process_str_literal(ident, expr),
                ast::Expr::TString(expr) => self.process_tstr(ident, expr),
                _ => {}
            }
        }
    }

    fn process_str_literal(&mut self, ident_name: &str, str: &ast::ExprStringLiteral) {
        self.process_range(ident_name, str.range(), Vec::new());
    }

    fn process_tstr(&mut self, ident_name: &str, tstr: &ast::ExprTString) {
        let vars = self.parse_tstr_vars(tstr);
        self.process_range(ident_name, tstr.range(), vars);
    }

    fn process_fstr(&mut self, ident_name: &str, fstr: &ast::ExprFString) {
        let vars = self.parse_fstr_vars(fstr);
        self.process_range(ident_name, fstr.range(), vars);
    }

    fn process_range(&mut self, ident: &str, node_range: TextRange, vars: Vec<PromptVar>) {
        let in_prompt_ident = self
            .prompt_idents_stack
            .iter()
            .rev()
            .any(|s| s.contains(ident));
        let is_prompt = ident.to_lowercase().contains("prompt") || in_prompt_ident;
        if !is_prompt {
            return;
        }

        let prompt = Prompt {
            file: self.file.clone(),
            span: self.span_shape_string_like(node_range),
            exp: self.code[node_range].to_string(),
            vars,
        };
        self.prompts.push(prompt);
    }

    fn detect_prompt_stmt(&mut self, stmt: &'a ast::Stmt) -> bool {
        let stmt_start = stmt.range().start();

        let mut last_idx: Option<usize> = None;
        let mut idx = self.comment_cursor;
        while idx < self.comments.len() && self.comments[idx].start() < stmt_start {
            last_idx = Some(idx);
            idx += 1;
        }

        match last_idx {
            Some(idx) => {
                self.comment_cursor = idx + 1;
                true
            }

            None => false,
        }
    }

    fn push_prompt_ident(&mut self, ident: &str) {
        if let Some(scope) = self.prompt_idents_stack.last_mut() {
            scope.insert(ident.to_string());
        }
    }
}

impl<'a> Visitor<'a> for PyPromptVisitor<'a> {
    fn visit_stmt(&mut self, stmt: &'a ast::Stmt) {
        let is_prompt = self.detect_prompt_stmt(stmt);

        // Process assignments.
        match stmt {
            ast::Stmt::Assign(assign) => {
                for target in &assign.targets {
                    self.process_assign_target(is_prompt, target, Some(&assign.value));
                }
            }

            ast::Stmt::AnnAssign(assign) => {
                self.process_assign_target(is_prompt, &*assign.target, assign.value.as_deref());
            }

            _ => {}
        }

        // Check if we are entering a new scope.
        let new_scope = matches!(stmt, ast::Stmt::FunctionDef(_) | ast::Stmt::ClassDef(_));
        if new_scope {
            self.prompt_idents_stack.push(HashSet::new());
        }

        // Visit nested statements.
        visitor::walk_stmt(self, stmt);

        // If we opened a scope, pop it off the stack.
        if new_scope {
            self.prompt_idents_stack.pop();
        }
    }
}

pub fn parse_prompts_py(source: &str, filename: &str) -> ParseResult {
    let parsed = match parser::parse_module(source) {
        Ok(parsed) => parsed,
        Err(err) => {
            return ParseResult::ParseResultError(ParseResultError {
                state: ParseResultErrorStateError,
                error: format!("{}", err),
            });
        }
    };

    let comments = PyParser::parse_comments(source, &parsed);

    let mut visitor = PyPromptVisitor::new(source, filename.to_string(), comments);
    visitor.visit_body(parsed.suite());

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
    fn detect_var_name_str() {
        let var_name_str_src = r#"user_prompt = "You are a helpful assistant.""#;
        assert_debug_snapshot!(parse_prompts_py(var_name_str_src, "prompts.py"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.py",
                        span: SpanShape {
                            outer: Span {
                                start: 14,
                                end: 44,
                            },
                            inner: Span {
                                start: 15,
                                end: 43,
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
    fn detect_var_name_fstr() {
        let var_name_fstr_src = r#"greeting_prompt = f"Welcome {user}!""#;
        assert_debug_snapshot!(parse_prompts_py(var_name_fstr_src, "prompts.py"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.py",
                        span: SpanShape {
                            outer: Span {
                                start: 18,
                                end: 36,
                            },
                            inner: Span {
                                start: 20,
                                end: 35,
                            },
                        },
                        exp: "f\"Welcome {user}!\"",
                        vars: [
                            PromptVar {
                                exp: "{user}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 28,
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
    fn detect_var_comment_str() {
        let var_comment_str_src = indoc! {r#"
            # @prompt
            system = "You are a helpful assistant."
        "#};
        assert_debug_snapshot!(parse_prompts_py(var_comment_str_src, "prompts.py"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.py",
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
        "#);
    }

    #[test]
    fn detect_var_comment_fstr() {
        let var_comment_fstr_src = indoc! {r#"
            # @prompt
            greeting = f"Welcome {user}!"
        "#};
        assert_debug_snapshot!(parse_prompts_py(var_comment_fstr_src, "prompts.py"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.py",
                        span: SpanShape {
                            outer: Span {
                                start: 21,
                                end: 39,
                            },
                            inner: Span {
                                start: 23,
                                end: 38,
                            },
                        },
                        exp: "f\"Welcome {user}!\"",
                        vars: [
                            PromptVar {
                                exp: "{user}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 31,
                                        end: 37,
                                    },
                                    inner: Span {
                                        start: 32,
                                        end: 36,
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
    fn detect_var_comment_dirty_str() {
        let var_comment_dirty_str_src = indoc! {r#"
            # @prompt system
            system = "You are a helpful assistant."
        "#};
        assert_debug_snapshot!(parse_prompts_py(var_comment_dirty_str_src, "prompts.py"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.py",
                        span: SpanShape {
                            outer: Span {
                                start: 26,
                                end: 56,
                            },
                            inner: Span {
                                start: 27,
                                end: 55,
                            },
                        },
                        exp: "\"You are a helpful assistant.\"",
                        vars: [],
                    },
                ],
            },
        )
        "#);
    }

    #[test]
    fn detect_var_comment_dirty_fstr() {
        let var_comment_dirty_fstr_src = indoc! {r#"
            # @prompt user
            greeting = f"Welcome {user}!"
        "#};
        assert_debug_snapshot!(parse_prompts_py(var_comment_dirty_fstr_src, "prompts.py"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.py",
                        span: SpanShape {
                            outer: Span {
                                start: 26,
                                end: 44,
                            },
                            inner: Span {
                                start: 28,
                                end: 43,
                            },
                        },
                        exp: "f\"Welcome {user}!\"",
                        vars: [
                            PromptVar {
                                exp: "{user}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 36,
                                        end: 42,
                                    },
                                    inner: Span {
                                        start: 37,
                                        end: 41,
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
    fn detect_var_comment_spaced() {
        let var_comment_src = indoc! {r#"
            # @prompt


            hello = "Hello, world!"

            # @prompt
            nope()

            world = "Hello!"
        "#};
        assert_debug_snapshot!(parse_prompts_py(var_comment_src, "prompts.py"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.py",
                        span: SpanShape {
                            outer: Span {
                                start: 20,
                                end: 35,
                            },
                            inner: Span {
                                start: 21,
                                end: 34,
                            },
                        },
                        exp: "\"Hello, world!\"",
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
            # @prompt
            number = 42

            hello = "Hello, world!"
        "#};
        let var_comment_mixed_result = parse_prompts_py(var_comment_mixed_src, "prompts.py");
        assert_prompts_size(var_comment_mixed_result, 0);
    }

    #[test]
    fn detect_var_comment_mixed_nested() {
        let var_comment_mixed_nested_src = indoc! {r#"
            class Hello:
                def world(self):
                    # @prompt
                    hello = 42

                    # @prompt
                    hi = 42

                    hi = "Hi!"

            hello = "Hello, world!"
        "#};
        let var_comment_mixed_nested_result =
            parse_prompts_py(var_comment_mixed_nested_src, "prompts.py");
        assert_prompts_size(var_comment_mixed_nested_result, 1);
    }

    #[test]
    fn detect_var_comment_none() {
        let var_comment_none_src = indoc! {r#"
            # @prompting
            hello = f"Hello, world!"
        "#};
        assert_prompts_size(parse_prompts_py(var_comment_none_src, "prompts.py"), 0)
    }

    #[test]
    fn detect_assign_var_comment() {
        let assign_var_comment_src = indoc! {r#"
            # @prompt
            hello : str
            hello = f"Assigned {value}"
        "#};
        assert_debug_snapshot!(parse_prompts_py(assign_var_comment_src, "prompts.py"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.py",
                        span: SpanShape {
                            outer: Span {
                                start: 30,
                                end: 49,
                            },
                            inner: Span {
                                start: 32,
                                end: 48,
                            },
                        },
                        exp: "f\"Assigned {value}\"",
                        vars: [
                            PromptVar {
                                exp: "{value}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 41,
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
    fn detect_multi_assign_var_comment() {
        let multi_assign_var_comment_src = indoc! {r#"
            # @prompt
            hello, world = "Hello", "World"
        "#};
        let multi_assign_var_comment_result =
            parse_prompts_py(multi_assign_var_comment_src, "prompts.py");
        assert_prompts_size(multi_assign_var_comment_result, 2);
    }

    #[test]
    fn detect_multi_assign_variants() {
        let src = indoc! {r#"
            # @prompt
            hello1, world1 = ("Hello", "World")
            # @prompt
            [hello2, world2] = ("Hello", "World")
            # @prompt
            (hello3, world3) = ("Hello", "World")
            # @prompt
            hello4, world4 = ["Hello", "World"]
            # @prompt
            [hello5, world5] = ["Hello", "World"]
            # @prompt
            (hello6, world6) = ["Hello", "World"]
        "#};
        let result = parse_prompts_py(src, "prompts.py");
        assert_prompts_size(result, 12);
    }

    #[test]
    fn detect_chained_assign() {
        let src = indoc! {r#"
            # @prompt
            hello = world = "Hi"
        "#};
        let result = parse_prompts_py(src, "prompts.py");
        assert_prompts_size(result, 2);
    }

    #[test]
    fn detect_reassign_var_comment() {
        let reassign_var_comment = indoc! {r#"
            # @prompt
            hello : Union[str, int]
            hello = 123

            hello = f"Assigned {value}"
        "#};
        assert_debug_snapshot!(parse_prompts_py(
            reassign_var_comment,
            "prompts.py"
        ), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.py",
                        span: SpanShape {
                            outer: Span {
                                start: 55,
                                end: 74,
                            },
                            inner: Span {
                                start: 57,
                                end: 73,
                            },
                        },
                        exp: "f\"Assigned {value}\"",
                        vars: [
                            PromptVar {
                                exp: "{value}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 66,
                                        end: 73,
                                    },
                                    inner: Span {
                                        start: 67,
                                        end: 72,
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
            regular_template = f"This is not a {value}"
            normal_string = "This is not special"
            regular = f"Regular template with {variable}"
            message = "Just a message"
            # @prompt
            number = 1
        "#};
        assert_prompts_size(parse_prompts_py(no_prompts_src, "prompts.py"), 0);
    }

    #[test]
    fn detect_multi_vars() {
        let multi_vars_src =
            r#"user_prompt = f"Hello, {name}! How is the weather today in {city}?""#;
        assert_debug_snapshot!(parse_prompts_py(multi_vars_src, "prompts.py"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.py",
                        span: SpanShape {
                            outer: Span {
                                start: 14,
                                end: 67,
                            },
                            inner: Span {
                                start: 16,
                                end: 66,
                            },
                        },
                        exp: "f\"Hello, {name}! How is the weather today in {city}?\"",
                        vars: [
                            PromptVar {
                                exp: "{name}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 23,
                                        end: 29,
                                    },
                                    inner: Span {
                                        start: 24,
                                        end: 28,
                                    },
                                },
                            },
                            PromptVar {
                                exp: "{city}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 59,
                                        end: 65,
                                    },
                                    inner: Span {
                                        start: 60,
                                        end: 64,
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
    fn parse_multiline_str() {
        let multiline_str_src = indoc! {r#"
            # @prompt
            system = """You are a helpful assistant.
            You will answer the user's questions to the best of your ability.
            If you don't know the answer, just say that you don't know, don't try to make it up."""
        "#};
        let multiline_str_result = parse_prompts_py(multiline_str_src, "prompts.py");
        assert_debug_snapshot!(multiline_str_result, @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.py",
                        span: SpanShape {
                            outer: Span {
                                start: 19,
                                end: 204,
                            },
                            inner: Span {
                                start: 22,
                                end: 201,
                            },
                        },
                        exp: "\"\"\"You are a helpful assistant.\nYou will answer the user's questions to the best of your ability.\nIf you don't know the answer, just say that you don't know, don't try to make it up.\"\"\"",
                        vars: [],
                    },
                ],
            },
        )
        "#);
    }

    #[test]
    fn parse_multiline_fstr() {
        let multiline_fstr_src = indoc! {r#"
            # @prompt
            user = f"""Hello, {name}!
            How is the weather today in {city}?
            """
        "#};
        let multiline_fstr_result = parse_prompts_py(multiline_fstr_src, "prompts.py");
        assert_debug_snapshot!(multiline_fstr_result, @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.py",
                        span: SpanShape {
                            outer: Span {
                                start: 17,
                                end: 75,
                            },
                            inner: Span {
                                start: 21,
                                end: 72,
                            },
                        },
                        exp: "f\"\"\"Hello, {name}!\nHow is the weather today in {city}?\n\"\"\"",
                        vars: [
                            PromptVar {
                                exp: "{name}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 28,
                                        end: 34,
                                    },
                                    inner: Span {
                                        start: 29,
                                        end: 33,
                                    },
                                },
                            },
                            PromptVar {
                                exp: "{city}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 64,
                                        end: 70,
                                    },
                                    inner: Span {
                                        start: 65,
                                        end: 69,
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
    fn parse_exp_vars() {
        let exp_vars_src = indoc! {r#"
            # @prompt
            prompt = f"Given that price is {price + (price * tax):.2f}..."
        "#};
        assert_debug_snapshot!(parse_prompts_py(exp_vars_src, "prompts.py"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.py",
                        span: SpanShape {
                            outer: Span {
                                start: 19,
                                end: 72,
                            },
                            inner: Span {
                                start: 21,
                                end: 71,
                            },
                        },
                        exp: "f\"Given that price is {price + (price * tax):.2f}...\"",
                        vars: [
                            PromptVar {
                                exp: "{price + (price * tax):.2f}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 41,
                                        end: 68,
                                    },
                                    inner: Span {
                                        start: 42,
                                        end: 67,
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
    fn parse_exp_complex_vars() {
        let exp_complex_vars_src = indoc! {r#"
            # @prompt
            prompt = f"This item is {('expensive' if price > 100 else 'cheap')}..."
        "#};
        assert_debug_snapshot!(parse_prompts_py(exp_complex_vars_src, "prompts.py"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.py",
                        span: SpanShape {
                            outer: Span {
                                start: 19,
                                end: 81,
                            },
                            inner: Span {
                                start: 21,
                                end: 80,
                            },
                        },
                        exp: "f\"This item is {('expensive' if price > 100 else 'cheap')}...\"",
                        vars: [
                            PromptVar {
                                exp: "{('expensive' if price > 100 else 'cheap')}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 34,
                                        end: 77,
                                    },
                                    inner: Span {
                                        start: 35,
                                        end: 76,
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
    fn handle_invalid_syntax() {
        let invalid_syntax_src = r#"x = "unclosed"#;
        assert!(matches!(
            parse_prompts_py(invalid_syntax_src, "prompts.py"),
            ParseResult::ParseResultError(_)
        ));
    }

    #[test]
    fn parse_spans_str() {
        let span_str_src = indoc! {r#"
            system_prompt = "You are a helpful assistant."
        "#};
        let span_str_result = parse_prompts_py(span_str_src, "prompts.py");
        assert_prompt_spans(span_str_src, span_str_result);
    }

    #[test]
    fn parse_spans_fstr() {
        let span_fstr_src = indoc! {r#"
            user_prompt = f"Hello, {name}! How is the weather today in {city}?"
        "#};
        let span_fstr_result = parse_prompts_py(span_fstr_src, "prompts.py");
        assert_prompt_spans(span_fstr_src, span_fstr_result);
    }

    #[test]
    fn parse_spans_multiline_str() {
        let span_str_src = indoc! {r#"
            system_prompt = """You are a helpful assistant.
            You will answer the user's questions to the best of your ability.
            If you don't know the answer, just say that you don't know, don't try to make it up."""
        "#};
        let span_str_result = parse_prompts_py(span_str_src, "prompts.py");
        assert_prompt_spans(span_str_src, span_str_result);
    }

    #[test]
    fn parse_spans_multiline_fstr() {
        let span_fstr_src = indoc! {r#"
            user_prompt = f"""Hello, {name}!
            How is the weather today in {city}?
            """
        "#};
        let span_fstr_result = parse_prompts_py(span_fstr_src, "prompts.py");
        assert_prompt_spans(span_fstr_src, span_fstr_result);
    }

    #[test]
    fn parse_nested() {
        let nested_src = indoc! {r#"
            class Hello:
                def world(self):
                    def fn():
                        hello_prompt = f"Hello, {name}!"

                        # @prompt
                        also_prmpt = "Hi!"
                    return fn
        "#};
        assert_debug_snapshot!(parse_prompts_py(nested_src, "prompts.py"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.py",
                        span: SpanShape {
                            outer: Span {
                                start: 79,
                                end: 96,
                            },
                            inner: Span {
                                start: 81,
                                end: 95,
                            },
                        },
                        exp: "f\"Hello, {name}!\"",
                        vars: [
                            PromptVar {
                                exp: "{name}",
                                span: SpanShape {
                                    outer: Span {
                                        start: 88,
                                        end: 94,
                                    },
                                    inner: Span {
                                        start: 89,
                                        end: 93,
                                    },
                                },
                            },
                        ],
                    },
                    Prompt {
                        file: "prompts.py",
                        span: SpanShape {
                            outer: Span {
                                start: 145,
                                end: 150,
                            },
                            inner: Span {
                                start: 146,
                                end: 149,
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
