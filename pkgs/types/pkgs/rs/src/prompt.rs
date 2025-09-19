use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct PromptVar {
    pub exp: String,
    pub span: super::span::SpanShape,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Prompt {
    pub file: String,
    pub span: super::span::SpanShape,
    pub exp: String,
    pub vars: Vec<PromptVar>,
}
