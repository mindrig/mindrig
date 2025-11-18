import { Versioned } from "../versioned";
import { Model } from "./model";

export type ModelSettings = ModelSettings.V1;

export namespace ModelSettings {
  export interface V1 extends Versioned<1> {
    type: Model.TypeLanguage["type"];
    maxOutputTokens?: number | undefined | null;
    temperature?: number | undefined | null;
    topP?: number | undefined | null;
    topK?: number | undefined | null;
    presencePenalty?: number | undefined | null;
    frequencyPenalty?: number | undefined | null;
    stopSequences?: string[] | undefined | null;
    seed?: number | undefined | null;
    reasoning?: Reasoning | undefined | null;
  }

  export interface Reasoning {
    enabled: boolean;
    // TODO: Not all models support effort, tokens, etc. We have to build
    // developer/model-specific reasoning capabilities map and also correctly
    // represent it in the UI.
    effort: ReasoningEffort;
    budgetTokens?: number | undefined | null;
  }

  export type ReasoningEffort = (typeof modelSettingsReasoningEffort)[number];
}

export const modelSettingsReasoningEffort = ["low", "medium", "high"] as const;

export function buildModelSettings(): ModelSettings {
  return { v: 1, type: "language" };
}

export function buildModelSettingsReasoning(
  overrides?: Partial<ModelSettings.Reasoning>,
): ModelSettings.Reasoning {
  return {
    enabled: true,
    effort: "medium",
    ...overrides,
  };
}
