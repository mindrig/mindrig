import { Prompt, Span } from "@volumen/types";

export namespace PromptParse {
  export interface Result {
    prompts: readonly Prompt[];
    source: Source;
  }

  export type Source = SourceParse | SourceCache | SourceFallback;

  export interface SourceParse {
    type: "parse";
  }

  export interface SourceCache {
    type: "cache";
    reason: DiscrepancyReason;
  }

  export interface SourceFallback {
    type: "fallback";
    reason: DiscrepancyReason;
  }

  export type DiscrepancyReason =
    | DiscrepancyReasonUnsupported
    | DiscrepancyReasonPlaceholder
    | DiscrepancyInvalid;

  export interface DiscrepancyReasonUnsupported {
    type: "unsupported";
  }

  export interface DiscrepancyReasonPlaceholder {
    type: "placeholder";
  }

  export interface DiscrepancyInvalid {
    type: "invalid";
    error: string;
  }
}

export function buildPromptParseResultFallback(): PromptParse.Result {
  return {
    prompts: [],
    source: {
      type: "fallback",
      reason: { type: "unsupported" },
    },
  };
}

export function buildPromptsParseResult(
  overrides?: Partial<PromptParse.Result>,
): PromptParse.Result {
  return {
    prompts: [],
    source: { type: "parse" },
    ...overrides,
  };
}

export function sliceSpan(source: string, span: Span): string {
  // NOTE: Regular JS slice doesn't work as Rust's `[x..y]`. As JS counts UTF-16
  // code units, while Rust counts bytes. To make it work correctly with
  // non-ASCII characters, we need to encode/decode as UTF-8.
  const decoder = new TextDecoder("utf-8");
  const bytes = new TextEncoder().encode(source);
  const slice = bytes.slice(span[0], span[1]);
  return decoder.decode(slice);
}
