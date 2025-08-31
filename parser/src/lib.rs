use std::collections::HashSet;

use mindcontrol_code_types::{
    ParseResult, ParseResultError, ParseResultErrorStateError, ParseResultSuccess,
    ParseResultSuccessStateSuccess,
};
use mindcontrol_code_types::{Prompt, PromptVar, Span};
use oxc_allocator::Allocator;
use oxc_allocator::Vec as OxcVec;
use oxc_ast::{Comment, Visit, ast::*};
use oxc_parser::{ParseOptions, Parser};
use oxc_span::{GetSpan, SourceType};
use wasm_bindgen::prelude::*;

mod comment;

struct PromptVisitor<'a> {
    code: &'a str,
    file: String,
    prompts: Vec<Prompt>,
    // Identifiers that have prompt annotations.
    prompt_idents: HashSet<String>,
    // Parsed comments.
    comments: &'a OxcVec<'a, Comment>,
    // Cursor to track position in comments array.
    comment_cursor: usize,
}

impl<'a> PromptVisitor<'a> {
    fn new(code: &'a str, file: String, comments: &'a OxcVec<'a, Comment>) -> Self {
        Self {
            code,
            file,
            prompts: Vec::new(),
            prompt_idents: HashSet::new(),
            comments,
            comment_cursor: 0,
        }
    }

    fn span(&self, span: &oxc_span::Span) -> Span {
        Span {
            start: span.start,
            end: span.end,
        }
    }

    fn process_variable_declarator(
        &mut self,
        declarator: &VariableDeclarator<'a>,
        prompt_comment: Option<&'a Comment>,
    ) {
        if let BindingPatternKind::BindingIdentifier(ident) = &declarator.id.kind {
            if prompt_comment.is_some() {
                self.prompt_idents.insert(ident.name.to_string());
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

    fn format_expression(&self, expr: &Expression<'a>) -> String {
        expr.span().source_text(self.code).to_string()
    }

    fn extract_template_vars(&self, template: &TemplateLiteral<'a>) -> Vec<PromptVar> {
        let mut vars = Vec::new();

        for expr in &template.expressions {
            // Use codegen to format any expression consistently
            let formatted = self.format_expression(expr);
            vars.push(PromptVar {
                exp: formatted,
                loc: self.span(&expr.span()),
            });
        }

        vars
    }

    fn get_template_text(&self, template: &TemplateLiteral<'a>) -> String {
        let code = template.span().source_text(self.code);
        if code.len() >= 2 && code.starts_with('`') && code.ends_with('`') {
            code[1..code.len() - 1].to_string()
        } else {
            // TODO: This is unexpected behavior so we might as well panic.
            code.to_string()
        }
    }

    fn process_template_literal(&mut self, ident_name: &str, template: &TemplateLiteral<'a>) {
        let prompt_comment = self.find_prompt_comment(&template.span());

        if self.is_prompt(ident_name, prompt_comment) {
            let prompt = Prompt {
                file: self.file.clone(),
                loc: self.span(&template.span),
                text: self.get_template_text(template),
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
                loc: self.span(&string.span),
                text: string.value.to_string(),
                vars: Vec::new(),
            };
            self.prompts.push(prompt);
        }
    }

    fn is_prompt(&self, ident_name: &str, prompt_comment: Option<&'a Comment>) -> bool {
        ident_name.to_lowercase().contains("prompt")
            || prompt_comment.is_some()
            || self.prompt_idents.contains(ident_name)
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
}

#[wasm_bindgen(typescript_custom_section)]
const TYPES_IMPORTS: &'static str = r#"
import type { ParseResult } from "@mindcontrol/code-types";
"#;

#[wasm_bindgen(js_name = parsePrompts, unchecked_return_type = "ParseResult")]
pub fn parse_prompts_wasm(source: &str, filename: &str) -> Result<JsValue, JsValue> {
    let result = parse_prompts(source, filename);
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

pub fn parse_prompts(source: &str, filename: &str) -> ParseResult {
    let allocator = Allocator::default();

    let source_type =
        SourceType::from_path(filename).unwrap_or(SourceType::default().with_typescript(true));

    let parser_return = Parser::new(&allocator, source, source_type)
        .with_options(ParseOptions::default())
        .parse();

    let result = if !parser_return.errors.is_empty() {
        let error_messages: Vec<String> = parser_return
            .errors
            .iter()
            .map(|e| format!("{}", e))
            .collect();

        ParseResult::ParseResultError(ParseResultError {
            state: ParseResultErrorStateError,
            error: error_messages.join("; "),
        })
    } else {
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
    };

    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use insta::assert_debug_snapshot;
    use pretty_assertions::assert_eq;

    #[test]
    fn detect_const_name() {
        let const_source = r#"const userPrompt = "You are a helpful assistant.";"#;
        assert_debug_snapshot!(parse_prompts(const_source, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        loc: Span {
                            start: 19,
                            end: 49,
                        },
                        text: "You are a helpful assistant.",
                        vars: [],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn detect_let_name() {
        let var_source = r#"var userPrompt = "You are a helpful assistant.";"#;
        assert_debug_snapshot!(parse_prompts(var_source, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        loc: Span {
                            start: 17,
                            end: 47,
                        },
                        text: "You are a helpful assistant.",
                        vars: [],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn detect_var_name() {
        let var_source = r#"var userPrompt = "You are a helpful assistant.";"#;
        assert_debug_snapshot!(parse_prompts(var_source, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        loc: Span {
                            start: 17,
                            end: 47,
                        },
                        text: "You are a helpful assistant.",
                        vars: [],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn detect_inline_comment() {
        let inline_comment_source = r#"const greeting = /* @prompt */ `Welcome ${user}!`;"#;
        assert_debug_snapshot!(parse_prompts(inline_comment_source, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        loc: Span {
                            start: 31,
                            end: 49,
                        },
                        text: "Welcome ${user}!",
                        vars: [
                            PromptVar {
                                exp: "user",
                                loc: Span {
                                    start: 42,
                                    end: 46,
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
        let inline_jsdoc_source = r#"const msg = /** @prompt */ "Hello world";"#;
        assert_debug_snapshot!(parse_prompts(inline_jsdoc_source, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        loc: Span {
                            start: 27,
                            end: 40,
                        },
                        text: "Hello world",
                        vars: [],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn detect_inline_dirty() {
        let inline_comment_dirty_source =
            r#"const greeting = /* @prompt greeting */ `Welcome ${user}!`;"#;
        assert_prompts_size(parse_prompts(inline_comment_dirty_source, "prompts.ts"), 1)
    }

    #[test]
    fn detect_inline_none() {
        let inline_comment_none_source = r#"const greeting = /* @prompting */ `Welcome ${user}!`;
const whatever = /* wrong@prompt */ "That's not it!";"#;
        assert_prompts_size(parse_prompts(inline_comment_none_source, "prompts.ts"), 0)
    }

    #[test]
    fn detect_var_comment() {
        let var_comment_source = r#"// @prompt
const hello = `Hello, world!`;"#;
        assert_debug_snapshot!(parse_prompts(var_comment_source, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        loc: Span {
                            start: 25,
                            end: 40,
                        },
                        text: "Hello, world!",
                        vars: [],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn detect_var_inline_comment() {
        let var_comment_source = r#"/* @prompt */
const hello = `Hello, world!`;"#;
        assert_debug_snapshot!(parse_prompts(var_comment_source, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        loc: Span {
                            start: 28,
                            end: 43,
                        },
                        text: "Hello, world!",
                        vars: [],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn detect_var_jsdoc() {
        let var_jsdoc_source = r#"/** @prompt */
const hello = `Hello, world!`;"#;
        assert_debug_snapshot!(parse_prompts(var_jsdoc_source, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        loc: Span {
                            start: 29,
                            end: 44,
                        },
                        text: "Hello, world!",
                        vars: [],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn detect_var_comment_spaced() {
        let var_comment_source = r#"// @prompt


const hello = `Hello, world!`;

// @prompt
nope()

const world = "Hello!";
"#;
        assert_debug_snapshot!(parse_prompts(var_comment_source, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        loc: Span {
                            start: 27,
                            end: 42,
                        },
                        text: "Hello, world!",
                        vars: [],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn detect_var_comment_none() {
        let var_comment_none_source = r#"// @prompting
const hello = `Hello, world!`;"#;
        assert_prompts_size(parse_prompts(var_comment_none_source, "prompts.ts"), 0)
    }

    #[test]
    fn detect_multi() {
        let source = r#"
const userPrompt = `Hello, ${name}!`;
const greeting = /* @prompt */ `Welcome ${user}!`;
// @prompt
const farewell = `Goodbye ${user.name}!`;
/** @prompt */
const system = "You are an AI assistant";
const regular = `Not a prompt ${value}`;
"#;
        let prompts = parse_prompts(source, "prompts.ts");
        assert_debug_snapshot!(prompts, @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        loc: Span {
                            start: 20,
                            end: 37,
                        },
                        text: "Hello, ${name}!",
                        vars: [
                            PromptVar {
                                exp: "name",
                                loc: Span {
                                    start: 30,
                                    end: 34,
                                },
                            },
                        ],
                    },
                    Prompt {
                        file: "prompts.ts",
                        loc: Span {
                            start: 70,
                            end: 88,
                        },
                        text: "Welcome ${user}!",
                        vars: [
                            PromptVar {
                                exp: "user",
                                loc: Span {
                                    start: 81,
                                    end: 85,
                                },
                            },
                        ],
                    },
                    Prompt {
                        file: "prompts.ts",
                        loc: Span {
                            start: 118,
                            end: 141,
                        },
                        text: "Goodbye ${user.name}!",
                        vars: [
                            PromptVar {
                                exp: "user.name",
                                loc: Span {
                                    start: 129,
                                    end: 138,
                                },
                            },
                        ],
                    },
                    Prompt {
                        file: "prompts.ts",
                        loc: Span {
                            start: 173,
                            end: 198,
                        },
                        text: "You are an AI assistant",
                        vars: [],
                    },
                ],
            },
        )
        "#)
    }

    #[test]
    fn detect_assign_var_name() {
        let assign_var_name_source = r#"
let myPrompt;
myPrompt = `Assigned ${value}`;
"#;
        assert_debug_snapshot!(parse_prompts(assign_var_name_source, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        loc: Span {
                            start: 26,
                            end: 45,
                        },
                        text: "Assigned ${value}",
                        vars: [
                            PromptVar {
                                exp: "value",
                                loc: Span {
                                    start: 38,
                                    end: 43,
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
    fn detect_assign_var_comment() {
        let assign_var_comment_source = r#"
// @prompt
let hello;
hello = `Assigned ${value}`;
"#;
        assert_debug_snapshot!(parse_prompts(assign_var_comment_source, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        loc: Span {
                            start: 31,
                            end: 50,
                        },
                        text: "Assigned ${value}",
                        vars: [
                            PromptVar {
                                exp: "value",
                                loc: Span {
                                    start: 43,
                                    end: 48,
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
        let reassign_var_comment = r#"
// @prompt
let hello;
hello = 123;

hello = `Assigned ${value}`;
"#;
        assert_debug_snapshot!(parse_prompts(
            reassign_var_comment,
            "prompts.ts"
        ), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        loc: Span {
                            start: 45,
                            end: 64,
                        },
                        text: "Assigned ${value}",
                        vars: [
                            PromptVar {
                                exp: "value",
                                loc: Span {
                                    start: 57,
                                    end: 62,
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
        let no_prompts_source = r#"
const regularTemplate = `This is not a ${value}`;
const normalString = "This is not special";
const regular = `Regular template with ${variable}`;
const message = "Just a message";
// @prompt
const number = 1;
"#;
        assert_prompts_size(parse_prompts(no_prompts_source, "prompts.ts"), 0);
    }

    #[test]
    fn single_var() {
        let single_var_source = r#"const userPrompt = `Hello, ${name}!`;"#;
        assert_debug_snapshot!(parse_prompts(single_var_source, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        loc: Span {
                            start: 19,
                            end: 36,
                        },
                        text: "Hello, ${name}!",
                        vars: [
                            PromptVar {
                                exp: "name",
                                loc: Span {
                                    start: 29,
                                    end: 33,
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
    fn multi_vars() {
        let multi_vars_source =
            r#"const userPrompt = `Hello, ${name}! How is the weather today in ${city}?`;"#;
        assert_debug_snapshot!(parse_prompts(multi_vars_source, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        loc: Span {
                            start: 19,
                            end: 73,
                        },
                        text: "Hello, ${name}! How is the weather today in ${city}?",
                        vars: [
                            PromptVar {
                                exp: "name",
                                loc: Span {
                                    start: 29,
                                    end: 33,
                                },
                            },
                            PromptVar {
                                exp: "city",
                                loc: Span {
                                    start: 66,
                                    end: 70,
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
    fn exp_vars() {
        let exp_vars_source = r#"const userPrompt = `Hello, ${user.name}! How is the weather today in ${user.location.city}?`;"#;
        assert_debug_snapshot!(parse_prompts(exp_vars_source, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        loc: Span {
                            start: 19,
                            end: 92,
                        },
                        text: "Hello, ${user.name}! How is the weather today in ${user.location.city}?",
                        vars: [
                            PromptVar {
                                exp: "user.name",
                                loc: Span {
                                    start: 29,
                                    end: 38,
                                },
                            },
                            PromptVar {
                                exp: "user.location.city",
                                loc: Span {
                                    start: 71,
                                    end: 89,
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
    fn exp_vars_complex() {
        let exp_vars_source =
            r#"const userPrompt = `Hello, ${User.fullName({ ...user.name, last: null })}!`;"#;
        assert_debug_snapshot!(parse_prompts(exp_vars_source, "prompts.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "prompts.ts",
                        loc: Span {
                            start: 19,
                            end: 75,
                        },
                        text: "Hello, ${User.fullName({ ...user.name, last: null })}!",
                        vars: [
                            PromptVar {
                                exp: "User.fullName({ ...user.name, last: null })",
                                loc: Span {
                                    start: 29,
                                    end: 72,
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
    fn invalid_syntax() {
        let invalid_source = r#"const invalid = `unclosed template"#;
        assert_debug_snapshot!(parse_prompts(invalid_source, "prompts.ts"), @r#"
        ParseResultError(
            ParseResultError {
                state: "error",
                error: "Unterminated string",
            },
        )
        "#);
    }

    #[test]
    fn js_code() {
        let js_source = r#"const prompt = /* @prompt */ `Hello ${world}!`;"#;
        assert_debug_snapshot!(parse_prompts(js_source, "test.js"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "test.js",
                        loc: Span {
                            start: 29,
                            end: 46,
                        },
                        text: "Hello ${world}!",
                        vars: [
                            PromptVar {
                                exp: "world",
                                loc: Span {
                                    start: 38,
                                    end: 43,
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
    fn jsx_code() {
        let jsx_source = r#"const prompt = /* @prompt */ `Hello ${world}!`;
const element = <div>{prompt}</div>;
"#;
        assert_debug_snapshot!(parse_prompts(jsx_source, "test.jsx"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "test.jsx",
                        loc: Span {
                            start: 29,
                            end: 46,
                        },
                        text: "Hello ${world}!",
                        vars: [
                            PromptVar {
                                exp: "world",
                                loc: Span {
                                    start: 38,
                                    end: 43,
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
    fn ts_code() {
        let ts_source = r#"const prompt : string = /* @prompt */ `Hello ${world}!`;"#;
        assert_debug_snapshot!(parse_prompts(ts_source, "test.ts"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "test.ts",
                        loc: Span {
                            start: 38,
                            end: 55,
                        },
                        text: "Hello ${world}!",
                        vars: [
                            PromptVar {
                                exp: "world",
                                loc: Span {
                                    start: 47,
                                    end: 52,
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
    fn tsx_code() {
        let tsx_source = r#"const prompt : string = /* @prompt */ `Hello ${world}!`;
const element = <div>{prompt}</div>;
"#;
        assert_debug_snapshot!(parse_prompts(tsx_source, "test.tsx"), @r#"
        ParseResultSuccess(
            ParseResultSuccess {
                state: "success",
                prompts: [
                    Prompt {
                        file: "test.tsx",
                        loc: Span {
                            start: 38,
                            end: 55,
                        },
                        text: "Hello ${world}!",
                        vars: [
                            PromptVar {
                                exp: "world",
                                loc: Span {
                                    start: 47,
                                    end: 52,
                                },
                            },
                        ],
                    },
                ],
            },
        )
        "#)
    }

    fn assert_prompts_size(result: ParseResult, expected_size: usize) {
        match result {
            ParseResult::ParseResultSuccess(ParseResultSuccess { prompts, .. }) => {
                assert_eq!(prompts.len(), expected_size);
            }
            ParseResult::ParseResultError(ParseResultError { error, .. }) => {
                panic!("Parsing failed: {}", error)
            }
        }
    }

    fn parse_test_code_wasm(source: &str, filename: &str) -> ParseResult {
        let result = parse_prompts_wasm(source, filename).expect("Parsing should succeed");
        let parse_result: ParseResult =
            serde_wasm_bindgen::from_value(result).expect("Deserialization should succeed");
        parse_result
    }
}
