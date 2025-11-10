import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import type { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import type { OpenAIChatLanguageModelOptions } from "@ai-sdk/openai";
import type { XaiProviderOptions } from "@ai-sdk/xai";
import { Model, ModelSettings } from "../model";

// TODO: There are several issues with the current reasoning implementation:
//
// - Not all reasoning models support all reasoning options and configuration is
//   way different, i.e. Anthropic has no effort setting, while OpenAI has no
//   budget tokens setting.
//
// - Same models have different configuration depending on the provider (not
//   developer!) used, i.e. AWS Bedrock running Anthropic models has different
//   reasoning options than Anthropic provider running the same models. Another
//   example is Groq provider.
//
// - Same options like effort have different set of options which requires
//   mapping and also correct UI representation.
//
// We're not going to address those in the initial release, but they should be
// tackled soon enough, ideally right after the release so we don't change
// the schema again.

export namespace AiSdkReasoning {
  export type Anthropic = Pick<AnthropicProviderOptions, "thinking">;

  export type OpenAi = Pick<OpenAIChatLanguageModelOptions, "reasoningEffort">;

  export type Google = Pick<
    GoogleGenerativeAIProviderOptions,
    "thinkingConfig"
  >;

  export type Xai = Pick<XaiProviderOptions, "reasoningEffort">;
}

// TODO: We can't type return type as AI SDK providers include undefineds
// while generateText props expect only JSONValue for providerOptions.
export function aiSdkReasoningForModel(
  ref: Model.Ref,
  reasoning: ModelSettings.Reasoning | undefined | null,
) /*: AiSdkProvider.Options*/ {
  if (!reasoning || !reasoning.enabled) return {};

  switch (ref.developerId) {
    case "anthropic":
      return aiSdkReasoningForAnthropic(reasoning);

    case "openai":
      return aiSdkReasoningForOpenAi(reasoning);

    case "google":
      return aiSdkReasoningForGoogle(reasoning);

    case "xai":
      return aiSdkReasoningForXai(reasoning);

    default:
      return {};
  }
}

// TODO: AWS Bedrock reasoning options are way different, see:
// https://ai-sdk.dev/providers/ai-sdk-providers/amazon-bedrock#reasoning
export function aiSdkReasoningForAnthropic(
  reasoning: ModelSettings.Reasoning,
): AiSdkReasoning.Anthropic {
  return {
    thinking: {
      type: "enabled",
      budgetTokens: reasoning.budgetTokens ?? undefined,
    },
  };
}

export function aiSdkReasoningForOpenAi(
  reasoning: ModelSettings.Reasoning,
): AiSdkReasoning.OpenAi {
  return {
    reasoningEffort: reasoning.effort,
  };
}

export function aiSdkReasoningForGoogle(
  reasoning: ModelSettings.Reasoning,
): AiSdkReasoning.Google {
  return {
    thinkingConfig: {
      includeThoughts: true,
      thinkingBudget: reasoning.budgetTokens || undefined,
    },
  };
}

export function aiSdkReasoningForXai(
  reasoning: ModelSettings.Reasoning,
): AiSdkReasoning.Xai {
  return {
    reasoningEffort: reasoning.effort === "medium" ? "high" : reasoning.effort,
  };
}
