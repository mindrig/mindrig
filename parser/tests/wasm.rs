use mindcontrol_code_parser::parse_prompts_wasm;
use mindcontrol_code_types::*;
use pretty_assertions::assert_eq;
use wasm_bindgen_test::*;

#[wasm_bindgen_test]
fn parse_js_value() {
    let source = r#"const msg = /** @prompt */ "Hello world";"#;
    let result = parse_test_code_wasm(source, "prompts.ts");
    assert_eq!(
        result,
        ParseResult::ParseResultSuccess(mindcontrol_code_types::ParseResultSuccess {
            state: ParseResultSuccessStateSuccess,
            prompts: vec![Prompt {
                file: "prompts.ts".into(),
                loc: Span { start: 27, end: 40 },
                text: "Hello world".into(),
                vars: vec![],
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
