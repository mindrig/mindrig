import { ModelDeveloper } from "./developer";
import { Model } from "./model";
import { ModelProvider } from "./provider";
import { ModelResponse } from "./response";

export const modelsDotdevUrl = "https://models.dev/api.json";

export namespace ModelDotdev {
  // TODO: Refactor when updated schema is published: https://github.com/sst/models.dev/blob/dev/packages/core/src/schema.ts

  //#region Ids

  // NOTE: Get up-to-date ids using command:
  //     curl --silent https://models.dev/api.json | jaq -r '[keys[] | "\"\(.)\""] | join(" | ")'
  export type ProviderId =
    | "abacus"
    | "aihubmix"
    | "alibaba"
    | "alibaba-cn"
    | "amazon-bedrock"
    | "anthropic"
    | "azure"
    | "azure-cognitive-services"
    | "bailing"
    | "baseten"
    | "cerebras"
    | "chutes"
    | "cloudflare-ai-gateway"
    | "cloudflare-workers-ai"
    | "cohere"
    | "cortecs"
    | "deepinfra"
    | "deepseek"
    | "fastrouter"
    | "fireworks-ai"
    | "friendli"
    | "github-copilot"
    | "github-models"
    | "google"
    | "google-vertex"
    | "google-vertex-anthropic"
    | "groq"
    | "helicone"
    | "huggingface"
    | "iflowcn"
    | "inception"
    | "inference"
    | "io-net"
    | "kimi-for-coding"
    | "llama"
    | "lmstudio"
    | "lucidquery"
    | "minimax"
    | "minimax-cn"
    | "mistral"
    | "modelscope"
    | "moonshotai"
    | "moonshotai-cn"
    | "morph"
    | "nano-gpt"
    | "nebius"
    | "nvidia"
    | "ollama-cloud"
    | "openai"
    | "opencode"
    | "openrouter"
    | "ovhcloud"
    | "perplexity"
    | "poe"
    | "requesty"
    | "sap-ai-core"
    | "scaleway"
    | "siliconflow"
    | "siliconflow-cn"
    | "submodel"
    | "synthetic"
    | "togetherai"
    | "upstage"
    | "v0"
    | "venice"
    | "vercel"
    | "vultr"
    | "wandb"
    | "xai"
    | "xiaomi"
    | "zai"
    | "zai-coding-plan"
    | "zenmux"
    | "zhipuai"
    | "zhipuai-coding-plan";

  export type ModelId = string & { [modelIdBrand]: true };
  declare const modelIdBrand: unique symbol;

  export type UnmatchedVendorId = Exclude<
    ModelProvider.Id | ModelDeveloper.Id,
    ProviderId
  >;

  export type UnmatchedProviderId = Exclude<
    ProviderId,
    ModelProvider.Id | ModelDeveloper.Id
  >;

  export type UnmatchedVendorIdsMap = {
    [Key in UnmatchedVendorId]: UnmatchedProviderId | null;
  };

  export type AliasedVendorId =
    typeof modelsDotdevUnmatchedVendorIdsMap extends infer Map
      ? {
          [Key in keyof Map]: Map[Key] extends ProviderId ? Key : never;
        }[keyof Map]
      : never;

  export type VendorAliasId =
    (typeof modelsDotdevUnmatchedVendorIdsMap)[UnmatchedVendorId] extends infer AliasId
      ? AliasId extends ProviderId
        ? AliasId
        : never
      : never;

  export type UnaliasedVendorId = Exclude<UnmatchedVendorId, AliasedVendorId>;

  export type UnaliasedVendorIdsLogoUrlsMap = {
    [Key in UnaliasedVendorId]: string;
  };

  //#endregion

  //#region Models.dev API

  export interface ApiProvider {
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
    models: Record<string, ApiModel>;
  }

  export interface ApiModel {
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
    cost: ApiModelCost;
    /** Model limit. */
    limit: ApiModelLimit;
    /** Supported modalities. */
    modalities: ApiModalities;
    /** Open weights model. */
    open_weights: boolean;
    /** Experimental model. */
    experimental?: boolean;
  }

  export interface ApiModelCost {
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

  export interface ApiModelLimit {
    /** Maximum context window (tokens). */
    context: number;
    /** Maximum output tokens. */
    output: number;
  }

  export interface ApiModalities {
    input: ApiModalityInput[];
    output: ApiModalityOutput[];
  }

  export type ApiModalityInput = "text" | "image" | "audio" | "video" | "pdf";

  export type ApiModalityOutput = "text";

  export type ApiListPayload = Record<ProviderId, ApiProvider>;

  export type ApiModelValue = ApiModel | undefined | null;

  //#endregion

  //#region List response

  export type ListResponseValue = ListResponse | undefined | null;

  export interface ListResponse {
    fetchedAt: number;
    data: ListResponseData;
  }

  export type ListResponseOk = ListResponse & { data: ListResponseDataOk };

  export type ListResponseOkValue = ListResponseOk | undefined | null;

  export type ListResponseData = ModelResponse.Data<ApiListPayload>;

  export type ListResponseDataOk = ListResponseData & { status: "ok" };

  //#endregion

  //#region Legacy

  export interface Capabilities {
    supportsImages: boolean;
    supportsVideo: boolean;
    supportsFiles: boolean;
    supportsTools: boolean;
    supportsReasoning: boolean;
  }

  //#endregion
}

//#region Utils

export function buildDotdevModelMeta(
  model: ModelDotdev.ApiModelValue,
): Model.MetaValue {
  if (!model) return model;

  return {
    releasedAt: model.release_date,
    updatedAt: model.last_updated,
    limit: model.limit,
    open: model.open_weights,
  };
}

export function buildDotdevModelCapabilities(
  model: ModelDotdev.ApiModelValue,
): Model.TypeLanguageCapabilitiesValue {
  if (!model) return model;
  return {
    modalities: buildDotdevModelModalities(model.modalities),
    attachment: model.attachment,
    toolCall: model.tool_call,
    reasoning: model.reasoning,
    temperature: model.temperature,
  };
}

export function buildDotdevModelModalities(
  modalities: ModelDotdev.ApiModalities,
): Model.TypeLanguageModalities {
  return {
    input: buildDotdevModalitiesMap(modalities.input),
    output: buildDotdevModalitiesMap(modalities.output),
  };
}

export function buildDotdevModalitiesMap<
  Input extends string[],
  Output extends Record<string, true>,
>(modalities: Input): Output {
  return Object.fromEntries(modalities.map((m) => [m, true])) as Output;
}

export function findDotdevModel(
  providerId: ModelProvider.Id,
  modelId: Model.Id,
  dotdev: ModelDotdev.ListResponseOkValue,
): ModelDotdev.ApiModelValue {
  if (!dotdev) return dotdev;
  const dotdevProviderId = matchDotdevProviderId(providerId);
  if (!dotdevProviderId) return null;
  const provider = dotdev?.data.payload[dotdevProviderId];
  return provider?.models[modelId] || null;
}

export function matchDotdevProviderId(
  id: ModelProvider.Id | ModelDeveloper.Id | ModelDotdev.ProviderId,
): ModelDotdev.ProviderId | null {
  return isUnmatchedVendorId(id) ? modelsDotdevUnmatchedVendorIdsMap[id] : id;
}

export function modelsDotdevLogoUrl(
  id: ModelProvider.Id | ModelDeveloper.Id | ModelDotdev.ProviderId,
): string {
  const providerId = matchDotdevProviderId(id);

  if (!providerId)
    return modelsDotdevUnaliasedVendorIdsLogoUrlsMap[
      id as ModelDotdev.UnaliasedVendorId
    ];

  return `https://models.dev/logos/${encodeURIComponent(providerId)}.svg`;
}

export function isUnmatchedVendorId(
  id: ModelProvider.Id | ModelDeveloper.Id | ModelDotdev.ProviderId,
): id is ModelDotdev.UnmatchedVendorId {
  return id in modelsDotdevUnmatchedVendorIdsMap;
}

export const modelsDotdevUnmatchedVendorIdsMap = {
  bedrock: "amazon-bedrock",
  fireworks: "fireworks-ai",
  novita: null,
  parasail: null,
  stealth: null,
  vertex: "google-vertex",
  voyage: null,
  amazon: "amazon-bedrock",
  meituan: null,
  meta: null,
  "arcee-ai": null,
  bfl: null,
  bytedance: null,
  kwaipilot: null,
  "prime-intellect": null,
} satisfies ModelDotdev.UnmatchedVendorIdsMap;

// TODO: Find logos for the unaliased ones. Right now they will render
// Models.dev's generic logo, but we can do better.
export const modelsDotdevUnaliasedVendorIdsLogoUrlsMap: ModelDotdev.UnaliasedVendorIdsLogoUrlsMap =
  {
    novita: "https://models.dev/logos/novita.svg",
    parasail: "https://models.dev/logos/parasail.svg",
    stealth: "https://models.dev/logos/stealth.svg",
    voyage: "https://models.dev/logos/voyage.svg",
    meituan: "https://models.dev/logos/meituan.svg",
    meta: "https://models.dev/logos/meta.svg",
    "arcee-ai": "https://models.dev/logos/arcee-ai.svg",
    bfl: "https://models.dev/logos/bfl.svg",
    bytedance: "https://models.dev/logos/bytedance.svg",
    kwaipilot: "https://models.dev/logos/kwaipilot.svg",
    "prime-intellect": "https://models.dev/logos/prime-intellect.svg",
  };

//#endregion

//#region Legacy

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

//#endregion
