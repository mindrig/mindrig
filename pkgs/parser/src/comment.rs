const PROMPT_LENGTH: usize = "@prompt".len();

/// Parses comment text to determine if it contains a valid @prompt annotation.
pub fn parse_comment(comment: &str) -> Option<bool> {
    let comment = comment.to_lowercase();
    if let Some(pos) = comment.find("@prompt") {
        let before_char = if pos == 0 {
            None
        } else {
            comment.chars().nth(pos - 1)
        };

        let after_pos = pos + PROMPT_LENGTH;
        let after_char = comment.chars().nth(after_pos);

        let valid_before = before_char.map_or(true, |c| !c.is_alphanumeric() && c != '_');
        let valid_after = after_char.map_or(true, |c| !c.is_alphanumeric() && c != '_');

        Some(valid_before && valid_after)
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn basic() {
        assert_eq!(parse_comment("@prompt"), Some(true));
        assert_eq!(parse_comment(" @prompt "), Some(true));
        assert_eq!(parse_comment("@prompt greeting"), Some(true));
        assert_eq!(parse_comment("greeting @prompt"), Some(true));
    }

    #[test]
    fn extra() {
        assert_eq!(parse_comment("@prompt for user greeting"), Some(true));
        assert_eq!(parse_comment("This is a @prompt comment"), Some(true));
        assert_eq!(parse_comment("* @prompt"), Some(true));
        assert_eq!(parse_comment("*@prompt"), Some(true));
        assert_eq!(parse_comment("* @prompt greeting"), Some(true));
        assert_eq!(parse_comment("  * @prompt  "), Some(true));
    }

    #[test]
    fn case() {
        assert_eq!(parse_comment("@PROMPT"), Some(true));
        assert_eq!(parse_comment("@Prompt"), Some(true));
        assert_eq!(parse_comment("@PrOmPt"), Some(true));
        assert_eq!(parse_comment("* @PROMPT"), Some(true));
        assert_eq!(parse_comment("@PROMPT for testing"), Some(true));
        assert_eq!(parse_comment("@Prompt with mixed case"), Some(true));
    }

    #[test]
    fn not_exact() {
        assert_eq!(parse_comment("@prompting"), Some(false));
        assert_eq!(parse_comment("my@prompt"), Some(false));
        assert_eq!(parse_comment("@prompter"), Some(false));
        assert_eq!(parse_comment("@prompt_var"), Some(false));
        assert_eq!(parse_comment("* @prompting"), Some(false));
        assert_eq!(parse_comment("* my@prompt"), Some(false));
    }

    #[test]
    fn unrelated_text() {
        assert_eq!(parse_comment("regular comment"), None);
        assert_eq!(parse_comment("* This is documentation"), None);
        assert_eq!(parse_comment("TODO: fix this"), None);
        assert_eq!(parse_comment(""), None);
        assert_eq!(parse_comment("   "), None);
    }

    #[test]
    fn punctuation() {
        assert_eq!(parse_comment("@prompt!"), Some(true));
        assert_eq!(parse_comment("@prompt."), Some(true));
        assert_eq!(parse_comment("@prompt,"), Some(true));
        assert_eq!(parse_comment("(@prompt)"), Some(true));
    }

    #[test]
    fn repeating() {
        assert_eq!(parse_comment("@prompt for @prompt usage"), Some(true));
    }
}
