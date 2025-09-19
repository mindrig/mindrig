use mindrig_types::*;
use pretty_assertions::assert_eq;

pub fn assert_prompts_size(result: ParseResult, expected_size: usize) {
    match result {
        ParseResult::ParseResultSuccess(ParseResultSuccess { prompts, .. }) => {
            assert_eq!(prompts.len(), expected_size);
        }
        ParseResult::ParseResultError(ParseResultError { error, .. }) => {
            panic!("Parsing failed: {}", error)
        }
    }
}

pub fn assert_prompt_spans(src: &str, result: ParseResult) {
    match result {
        ParseResult::ParseResultSuccess(ParseResultSuccess { prompts, .. }) => {
            assert!(
                prompts.len() > 0,
                "Expected at least one prompt inside ParseResult"
            );

            for prompt in &prompts {
                assert_eq!(
                    &src[prompt.span.outer.start as usize..prompt.span.outer.end as usize],
                    prompt.exp
                );

                for var in &prompt.vars {
                    assert_eq!(
                        &src[var.span.outer.start as usize..var.span.outer.end as usize],
                        var.exp
                    );
                }
            }
        }

        _ => panic!("Expected ParseResultSuccess"),
    }
}
