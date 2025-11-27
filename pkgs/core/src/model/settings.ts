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

  export type InternalKey = "type" | "v";

  export type Setting = Exclude<keyof ModelSettings.V1, InternalKey>;

  export type Pair = keyof ModelSettings.V1 extends infer Key extends
    keyof ModelSettings.V1
    ? Key extends Key
      ? [Key, ModelSettings.V1[Key]]
      : never
    : never;

  export interface Reasoning {
    enabled: boolean;
    // TODO: Not all models support effort, tokens, etc. We have to build
    // developer/model-specific reasoning capabilities map and also correctly
    // represent it in the UI.
    effort: ReasoningEffort;
    budgetTokens?: number | undefined | null;
  }

  export type ReasoningEffort = (typeof modelSettingsReasoningEffort)[number];

  export type TitlesMap = {
    [Key in Setting]: string;
  };

  export type ReasoningTitlesMap = {
    [Key in keyof Reasoning]: string;
  };

  export type Sanitized = Pick<ModelSettings, InternalKey> &
    Partial<Omit<ModelSettings, InternalKey>>;
}

export const modelSettingsReasoningEffort = ["low", "medium", "high"] as const;

export function buildModelSettings(): ModelSettings {
  return { v: 1, type: "language", stopSequences: [""] };
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

export function sanitizeModelSettings(
  settings: ModelSettings,
): ModelSettings.Sanitized {
  const { v, type, ...restSettings } = settings;
  const sanitized: ModelSettings.Sanitized = {
    v: settings.v,
    type: settings.type,
    ...sanitizeModelSettingsValue(restSettings),
  };
  return sanitized;
}

export function sanitizeModelSettingsValue(value: unknown): any {
  if (typeof value === "string") return !value.trim() ? null : value;

  if (typeof value === "number") return isNaN(value) ? null : value;

  if (Array.isArray(value)) {
    const sanitizedArray = value
      .map(sanitizeModelSettingsValue)
      .filter((item) => item != null);
    return !sanitizedArray.length ? null : sanitizedArray;
  }

  if (value && typeof value === "object") {
    const sanitizedObject: Record<string, any> = {};

    Object.entries(value).forEach(([k, v]) => {
      const sanitizedValue = sanitizeModelSettingsValue(v);
      if (sanitizedValue != null) sanitizedObject[k] = sanitizedValue;
    });

    return !Object.keys(sanitizedObject).length ? null : sanitizedObject;
  }

  return value == null ? null : value;
}

export const MODEL_SETTING_TITLES: ModelSettings.TitlesMap = {
  maxOutputTokens: "Max output tokens",
  temperature: "Temperature",
  topP: "Top P",
  topK: "Top K",
  presencePenalty: "Presence penalty",
  frequencyPenalty: "Frequency penalty",
  stopSequences: "Stop sequences",
  seed: "Seed",
  reasoning: "Reasoning",
};

export const MODEL_SETTING_REASONING_TITLES = {
  enabled: "Enable reasoning",
  effort: "Effort",
  budgetTokens: "Budget tokens",
};
