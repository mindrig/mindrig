use super::prompt::Prompt;
use serde::{Deserialize, Serialize};
use litty::literal;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ParseResult {
    ParseResultError(ParseResultError),
    ParseResultSuccess(ParseResultSuccess),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ParseResultError {
    pub state: ParseResultErrorStateError,
    pub error: String,
}

#[literal("error")]
pub struct ParseResultErrorStateError;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ParseResultSuccess {
    pub state: ParseResultSuccessStateSuccess,
    pub prompts: Vec<Prompt>,
}

#[literal("success")]
pub struct ParseResultSuccessStateSuccess;
