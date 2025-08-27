use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct PromptVar {
    pub exp: String,
    pub loc: super::span::Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Prompt {
    pub file: String,
    pub loc: super::span::Span,
    pub text: String,
    pub vars: Vec<PromptVar>,
}
