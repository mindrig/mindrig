import { LanguageModelUsage } from "ai";
import { ModelUsage } from "../model";

export function aiSdkUsageToModelUsage(usage: LanguageModelUsage): ModelUsage {
  return {
    input: usage.inputTokens,
    output: usage.outputTokens,
    // TODO: Right now not all AI SDK usage data is used. We have to expand this.
    // Unused fields:
    // - totalTokens
    // - reasoningTokens
    // - cachedInputTokens
  };
}
