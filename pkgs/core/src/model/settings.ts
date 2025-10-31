import { Versioned } from "../versioned";

export type ModelSettings = ModelSettings.V1;

export namespace ModelSettings {
  export interface V1 extends Versioned<1> {}

  export interface Reasoning {
    enabled: boolean;
    effort: "low" | "medium" | "high";
    budgetTokens?: number | "";
  }
}

export function buildModelSettings(): ModelSettings {
  return { v: 1 };
}
