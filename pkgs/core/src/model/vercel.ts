import type {
  GatewayLanguageModelEntry,
  GatewayLanguageModelSpecification,
} from "@ai-sdk/gateway";
import { ModelDeveloper } from "./developer.js";
import type { ModelGateway } from "./gateway.js";
import { Model } from "./model.js";
import type { ModelResponse } from "./response.js";

export namespace ModelVercel {
  //#region Ids

  // NOTE: Get up-to-date ids using command:
  //     curl --silent http://localhost:3110/vercel/models | jaq -r '[.models[].id | split("/")[0]] | unique | sort | map("\"" + . + "\"") | join(" | ")'
  export type DeveloperId =
    | "alibaba"
    | "amazon"
    | "anthropic"
    | "cohere"
    | "deepseek"
    | "google"
    | "inception"
    | "meituan"
    | "meta"
    | "mistral"
    | "moonshotai"
    | "morph"
    | "openai"
    | "perplexity"
    | "stealth"
    | "vercel"
    | "voyage"
    | "xai"
    | "zai";

  // NOTE: Get up-to-date ids using command:
  //     curl --silent http://localhost:3110/vercel/models | jaq -r '[.models[].specification.provider] | unique | sort | map("\"" + . + "\"") | join(" | ")'
  export type ProviderId =
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

  export type ModelId = `${DeveloperId}/${Model.Id}`;

  //#endregion

  //#region Vercel api

  export interface ApiModel
    extends Omit<GatewayLanguageModelEntry, "id" | "specification"> {
    /** Model id. */
    id: ModelId;
    specification: ApiModelSpecification;
  }

  export interface ApiGetAvailableModelsPayload {
    models: ApiModel[];
    credits: Credits;
  }

  export interface ApiModelSpecification
    extends Omit<GatewayLanguageModelSpecification, "provider" | "modelId"> {
    provider: ProviderId;
    modelId: ModelId;
  }

  export type ApiPricing = ApiModel["pricing"] & {};

  export type ApiModelTypeValue = ApiModel["modelType"];

  //#endregion

  //#region Model

  export interface GatewayModel {
    type: "vercel";
    payload: ApiModel;
  }

  //#endregion

  //#region List

  export interface ListResponse {
    type: "vercel";
    /** Indicates whether data came from a user-scoped call or the fallback wrapper. */
    source: ModelGateway.ListSource;
    /** Epoch timestamp in milliseconds when the response was resolved. */
    fetchedAt: number;
    data: ListResponseData;
  }

  export type ListResponseData =
    ModelResponse.Data<ModelVercel.ApiGetAvailableModelsPayload>;

  //#endregion

  //#region Access

  export interface Access {
    type: "vercel";
    id: ModelId;
  }

  //#endregion

  //#region Credits

  export interface Credits {
    balance: string;
    totalUsed: string;
  }

  //#endregion
}

//#region Utils

export function parseVercelModelId(
  model: ModelVercel.ApiModel,
): [ModelDeveloper.Id, Model.Id] {
  const chunks = model.specification.modelId.split("/");
  return [chunks[0] as ModelDeveloper.Id, chunks[1] as Model.Id];
}

export function buildVercelGatewayModel(
  apiModel: ModelVercel.ApiModel,
): ModelVercel.GatewayModel {
  return {
    type: "vercel",
    payload: apiModel,
  };
}

export function buildVercelModelAccess(
  model: ModelVercel.ApiModel,
): Model.Access {
  return {
    type: "vercel",
    id: model.specification.modelId,
  };
}

export function buildVercelModelPricing(
  model: ModelVercel.ApiModel,
): Model.PricingValue {
  const { pricing } = model;
  if (!pricing) return pricing;
  return {
    input: pricing.input,
    output: pricing.output,
    cache: buildVercelModelCachePricing(pricing),
  };
}

export function buildVercelModelCachePricing(
  pricing: ModelVercel.ApiPricing,
): Model.PricingCacheValue {
  if (!pricing.cachedInputTokens || !pricing.cacheCreationInputTokens) return;
  return {
    input: pricing.cachedInputTokens,
    creationInput: pricing.cacheCreationInputTokens,
  };
}

//#endregion
