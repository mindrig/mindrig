import { Prompt } from "@mindrig/types";

export namespace PromptParse {
  export interface Result {
    prompts: Prompt[];
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

export function promptParseResultPlaceholder(): PromptParse.Result {
  return {
    prompts: [],
    source: {
      type: "fallback",
      reason: {
        type: "placeholder",
      },
    },
  };
}
