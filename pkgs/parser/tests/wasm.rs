use indoc::indoc;
use mindrig_parser::parse_prompts_wasm;
use mindrig_types::*;
use pretty_assertions::assert_eq;
use wasm_bindgen_test::*;

// NOTE: Add to run tests in browser, i.e.,: `wasm-pack test --chrome`
// wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
#[allow(dead_code)]
fn parse_js_value() {
    let js_source = indoc! {r#"
        const msg = /** @prompt */ "Hello world";
    "#};
    let js_result = parse_test_code_wasm(js_source, "prompts.js");
    assert_eq!(
        js_result,
        ParseResult::ParseResultSuccess(ParseResultSuccess {
            state: ParseResultSuccessStateSuccess,
            prompts: vec![Prompt {
                file: "prompts.js".into(),
                span: SpanShape {
                    outer: Span { start: 27, end: 40 },
                    inner: Span { start: 28, end: 39 },
                },
                exp: "\"Hello world\"".into(),
                vars: vec![],
            }]
        })
    );
}

#[wasm_bindgen_test]
#[allow(dead_code)]
fn parse_py_value() {
    let py_source = indoc! {r#"
        # @prompt
        msg = f"Hello {name}!"
    "# };
    let py_result = parse_test_code_wasm(py_source, "prompts.py");
    assert_eq!(
        py_result,
        ParseResult::ParseResultSuccess(ParseResultSuccess {
            state: ParseResultSuccessStateSuccess,
            prompts: vec![Prompt {
                file: "prompts.py".into(),
                span: SpanShape {
                    outer: Span { start: 16, end: 32 },
                    inner: Span { start: 18, end: 31 }
                },
                exp: "f\"Hello {name}!\"".into(),
                vars: vec![PromptVar {
                    exp: "{name}".into(),
                    span: SpanShape {
                        outer: Span { start: 24, end: 30 },
                        inner: Span { start: 25, end: 29 },
                    }
                }],
            }]
        })
    );
}

fn parse_test_code_wasm(source: &str, filename: &str) -> ParseResult {
    let result = parse_prompts_wasm(source, filename).expect("Parsing should succeed");
    let parse_result: ParseResult =
        serde_wasm_bindgen::from_value(result).expect("Deserialization should succeed");
    parse_result
}
