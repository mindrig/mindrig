export interface ModelSettings {}

export namespace ModelSettings {
  export interface Reasoning {
    enabled: boolean;
    effort: "low" | "medium" | "high";
    budgetTokens?: number | "";
  }
}
