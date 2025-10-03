export function modelsDotdevUrl(): string {
  return "https://models.dev/api.json";
}

export namespace ModelDotdev {
  // TODO: Refactor when updated schema is published: https://github.com/sst/models.dev/blob/dev/packages/core/src/schema.ts

  // NOTE: Get up-to-date ids using command:
  //     curl --silent https://models.dev/api.json | jaq -r '[keys[] | "\"\(.)\""] | join(" | ")'
  export type ProviderId =
    | "alibaba"
    | "alibaba-cn"
    | "amazon-bedrock"
    | "anthropic"
    | "azure"
    | "baseten"
    | "cerebras"
    | "chutes"
    | "cloudflare-workers-ai"
    | "cortecs"
    | "deepinfra"
    | "deepseek"
    | "fastrouter"
    | "fireworks-ai"
    | "github-copilot"
    | "github-models"
    | "google"
    | "google-vertex"
    | "google-vertex-anthropic"
    | "groq"
    | "huggingface"
    | "inception"
    | "inference"
    | "llama"
    | "lmstudio"
    | "lucidquery"
    | "mistral"
    | "modelscope"
    | "moonshotai"
    | "moonshotai-cn"
    | "morph"
    | "nvidia"
    | "openai"
    | "opencode"
    | "openrouter"
    | "perplexity"
    | "requesty"
    | "submodel"
    | "synthetic"
    | "togetherai"
    | "upstage"
    | "v0"
    | "venice"
    | "vercel"
    | "wandb"
    | "xai"
    | "zai"
    | "zai-coding-plan"
    | "zhipuai"
    | "zhipuai-coding-plan";

  export interface Provider {
    /** Provider id. */
    id: ProviderId;
    /** Display name of the provider. */
    name: string;
    /** AI SDK Package name. */
    npm: string;
    /** Environment variable keys used for auth. */
    env: string[];
    /** OpenAI-compatible API endpoint. Required only when using
     * `@ai-sdk/openai-compatible` as the npm package. */
    api?: string;
    /** Link to the provider's documentation. */
    doc: string;
    /** Provider models. */
    models: Record<string, Model>;
  }

  export type ModelId = string & { [modelIdBrand]: true };
  declare const modelIdBrand: unique symbol;

  export interface Model {
    /** Model id. */
    id: ModelId;
    /** Display name of the model. */
    name: string;
    /** Supports file attachments. */
    attachment: boolean;
    /** Supports advanced reasoning. */
    reasoning: boolean;
    /** Supports temperature setting. */
    temperature: boolean;
    /** Supports tool calling. */
    tool_call: boolean;
    /** Knowledge cut-off in `YYYY-MM` or `YYYY-MM-DD`. */
    knowledge?: string;
    /** First public release date in `YYYY-MM` or `YYYY-MM-DD`. */
    release_date: string;
    /** Most recent update date in `YYYY-MM` or `YYYY-MM-DD`. */
    last_updated: string;
    /** Model cost. */
    cost: ModelCost;
    /** Model limit. */
    limit: ModelLimit;
    /** Supported modalities. */
    modalities: Modalities;
    /** Open weights model. */
    open_weights: boolean;
    /** Experimental model. */
    experimental?: boolean;
  }

  export interface ModelCost {
    /** Cost per million input tokens (USD). */
    input: number;
    /** Cost per million output tokens (USD). */
    output: number;
    /** Cost per million reasoning tokens (USD). */
    reasoning?: number;
    /** Cost per million cached read tokens (USD). */
    cache_read?: number;
    /** Cost per million cached write tokens (USD). */
    cache_write?: number;
    /** Cost per million audio input tokens, if billed separately (USD). */
    input_audio?: number;
    /** Cost per million audio output tokens, if billed separately (USD). */
    output_audio?: number;
  }

  export interface ModelLimit {
    /** Maximum context window (tokens). */
    context: number;
    /** Maximum output tokens. */
    output: number;
  }

  export interface Modalities {
    input: ModalityInput[];
    output: ModalityOutput[];
  }

  export type ModalityInput = "text" | "image" | "audio" | "video" | "pdf";

  export type ModalityOutput = "text";

  export type Response = Record<ProviderId, Provider>;

  export interface Meta {
    modalities?: Modalities;
    attachment?: boolean;
    tool_call?: boolean;
    reasoning?: boolean;
    name?: string;
    release_date?: string;
    last_updated?: string;
    knowledge?: string;
    open_weights?: boolean;
    temperature?: boolean;
    cost?: Record<string, unknown>;
    limit?: Record<string, unknown>;
    [key: string]: unknown;
  }

  export interface Capabilities {
    supportsImages: boolean;
    supportsVideo: boolean;
    supportsFiles: boolean;
    supportsTools: boolean;
    supportsReasoning: boolean;
  }
}

let MODELS_DEV_CACHE: ModelDotdev.Response | null = null;

export function setModelsDevData(data: ModelDotdev.Response | null) {
  MODELS_DEV_CACHE = data;
}

export function getModelCapabilities(
  provider: string,
  modelId: string,
): ModelDotdev.Capabilities {
  const prov = (provider || "").toLowerCase();
  const id = (modelId || "").toLowerCase();

  const fallback: ModelDotdev.Capabilities = {
    supportsImages: false,
    supportsVideo: false,
    supportsFiles: false,
    supportsTools: false,
    supportsReasoning: false,
  };

  const data = MODELS_DEV_CACHE as any;
  if (!data) return fallback;

  const provData = data[prov];
  const models: Record<string, any> | undefined = provData?.models;
  if (models) {
    const entries = Object.entries(models);
    for (const [key, meta] of entries) {
      if (!id.includes(key.toLowerCase())) continue;
      const input: string[] = meta?.modalities?.input || [];
      return {
        supportsImages: input.includes("image"),
        supportsVideo: input.includes("video"),
        supportsFiles: !!meta?.attachment,
        supportsTools: !!meta?.tool_call,
        supportsReasoning: !!meta?.reasoning,
      } as ModelDotdev.Capabilities;
    }
  }

  // Secondary: scan all providers to match by key substring
  for (const provEntry of Object.values(data as any) as any[]) {
    const m = provEntry?.models || {};
    for (const [key, meta] of Object.entries(m)) {
      if (!id.includes((key as string).toLowerCase())) continue;
      const input: string[] = (meta as any)?.modalities?.input || [];
      return {
        supportsImages: input.includes("image"),
        supportsVideo: input.includes("video"),
        supportsFiles: !!(meta as any)?.attachment,
        supportsTools: !!(meta as any)?.tool_call,
        supportsReasoning: !!(meta as any)?.reasoning,
      } as ModelDotdev.Capabilities;
    }
  }

  return fallback;
}

export function providerFromEntry(entry: {
  id: string | undefined | null;
  specification?: { provider?: string } | undefined | null;
}): string {
  const id = entry?.id || "";
  const provider = entry?.specification?.provider || id.split("/")[0] || "";
  return provider;
}

export function selectedModelCapabilities(entry: {
  id: string | undefined | null;
  specification?: { provider?: string } | undefined | null;
}): ModelDotdev.Capabilities & { provider: string } {
  const provider = providerFromEntry(entry);
  const id = entry?.id || "";
  const caps = getModelCapabilities(provider, id);
  return { ...caps, provider };
}

export function providerLogoUrl(
  providerId: string | undefined | null,
  opts?: { base?: string; format?: "svg" | "png" },
): string {
  const id = (providerId ?? "").toLowerCase().trim();
  if (!id) return "";
  const base = opts?.base ?? "https://models.dev/logos";
  const format = opts?.format ?? "svg";
  return `${base}/${encodeURIComponent(id)}.${format}`;
}
