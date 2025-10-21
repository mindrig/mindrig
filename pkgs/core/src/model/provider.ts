import type { ModelDotdev } from "./dotdev";

export interface ModelProvider {
  id: ModelProvider.Id;
  /** Provider meta information. `undefined` if not resolved, `null` if
   * not available. */
  meta: ModelProvider.Meta | undefined | null;
}

export namespace ModelProvider {
  // NOTE: Get up-to-date ids using command:
  //     curl --silent http://localhost:3110/vercel/models | jaq -r '[.models[].specification.provider] | unique | sort | map("\"" + . + "\"") | join(" | ")'
  export type Id =
    | "alibaba"
    | "anthropic"
    | "azure"
    | "baseten"
    | "bedrock"
    | "chutes"
    | "cohere"
    | "deepinfra"
    | "deepseek"
    | "fireworks"
    | "google"
    | "groq"
    | "inception"
    | "mistral"
    | "moonshotai"
    | "morph"
    | "novita"
    | "openai"
    | "parasail"
    | "perplexity"
    | "stealth"
    | "vercel"
    | "vertex"
    | "voyage"
    | "xai"
    | "zai";

  export interface Meta {
    id: ModelDotdev.ProviderId;
    name: string;
    logoUrl: string | undefined;
    docsUrl: string | undefined;
  }
}
