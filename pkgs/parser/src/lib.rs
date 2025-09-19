use wasm_bindgen::prelude::*;

mod comment;
mod py;
#[cfg(test)]
mod test;
mod ts;

use mindrig_types::ParseResult;

#[wasm_bindgen(typescript_custom_section)]
const TYPES_IMPORTS: &'static str = r#"
import type { ParseResult } from "@mindrig/types";
"#;

#[wasm_bindgen(js_name = parsePrompts, unchecked_return_type = "ParseResult")]
pub fn parse_prompts_wasm(source: &str, filename: &str) -> Result<JsValue, JsValue> {
    let result = parse_prompts(source, filename);
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

pub fn parse_prompts(source: &str, filename: &str) -> ParseResult {
    let lower = filename.to_ascii_lowercase();
    if lower.ends_with(".py") || lower.ends_with(".pyi") {
        py::parse_prompts_py(source, filename)
    } else {
        ts::parse_prompts_ts(source, filename)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test::*;

    #[test]
    fn parse_js() {
        let js_source = r#"
// This is a comment
const prompt = "Hello, {name}!";
"#;
        let js_result = parse_prompts(js_source, "example.js");
        assert_prompts_size(js_result, 1);
    }

    #[test]
    fn parse_jsx() {
        let jsx_source = r#"
// This is a comment
const prompt = "Hello, {name}!";
const jsx = <div>{prompt}</div>;
"#;
        let jsx_result = parse_prompts(jsx_source, "example.jsx");
        assert_prompts_size(jsx_result, 1);
    }

    #[test]
    fn parse_ts() {
        let ts_source = r#"
// This is a comment
const prompt = "Hello, {name}!";
"#;
        let ts_result = parse_prompts(ts_source, "example.ts");
        assert_prompts_size(ts_result, 1);
    }

    #[test]
    fn parse_tsx() {
        let tsx_source = r#"
// This is a comment
const prompt = "Hello, {name}!";
const tsx = <div>{prompt}</div>;
"#;
        let tsx_result = parse_prompts(tsx_source, "example.tsx");
        assert_prompts_size(tsx_result, 1);
    }

    #[test]
    fn parse_mjs() {
        let mjs_source = r#"
// This is a comment
const prompt = "Hello, {name}!";
"#;
        let mjs_result = parse_prompts(mjs_source, "example.mjs");
        assert_prompts_size(mjs_result, 1);
    }

    #[test]
    fn parse_cjs() {
        let cjs_source = r#"
// This is a comment
const prompt = "Hello, {name}!";
"#;
        let cjs_result = parse_prompts(cjs_source, "example.cjs");
        assert_prompts_size(cjs_result, 1);
    }

    #[test]
    fn parse_py() {
        let py_source = r#"
# This is a comment
prompt = "Hello, {name}!"
"#;
        let py_result = parse_prompts(py_source, "example.py");
        assert_prompts_size(py_result, 1);
    }

    #[test]
    fn parse_pyi() {
        let pyi_source = r#"
# This is a comment
prompt: str = "Hello, {name}!"
"#;
        let pyi_result = parse_prompts(pyi_source, "example.pyi");
        assert_prompts_size(pyi_result, 1);
    }
}
