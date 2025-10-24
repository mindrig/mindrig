import { Prompt } from "@mindrig/types";

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
