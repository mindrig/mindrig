import { modelsDotdevLogoUrl } from "./dotdev.js";
import { Model } from "./model.js";
import { MODEL_DEVELOPER_ORDER_WEIGHTS } from "./order.js";

export interface ModelDeveloper {
  id: ModelDeveloper.Id;
  /** Meta data about the developer. It might be missing, when gateway adds
   * a new developer but we didn't update the fallbacks yet. */
  meta: ModelDeveloper.Meta | undefined;
  /** Order weight, if defined will be used for sorting. Otherwise, it will be
   * sorted by name. */
  order: number | undefined;
}

export namespace ModelDeveloper {
  //#region Ids

  // NOTE: Get up-to-date ids using command:
  //     curl --silent http://localhost:3110/vercel/models | jaq -r '[.models[].id | split("/")[0]] | unique | sort | map("\"" + . + "\"") | join(" | ")'
  export type Id =
    | "alibaba"
    | "amazon"
    | "anthropic"
    | "cohere"
    | "deepseek"
    | "google"
    | "inception"
    | "meituan"
    | "meta"
    | "minimax"
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

  //#endregion

  //#region Meta

  export interface Meta {
    name: string;
    logoUrl?: string | undefined;
    websiteUrl: string | undefined;
  }

  export type MetaMap = {
    [Key in Id]: Meta;
  };

  //#endregion

  //#region Mapping

  export type Items = Item[];

  export interface Item {
    id: Id;
    name: string | undefined;
    logoUrl: string | undefined;
  }

  //#endregion
}

//#region Utils

//#region Mapping

export function buildModelDeveloper(id: ModelDeveloper.Id): ModelDeveloper {
  return {
    id,
    meta: modelDevelopersMeta[id],
    order: MODEL_DEVELOPER_ORDER_WEIGHTS[id],
  };
}

export function mapModelDeveloperItems(
  modelsMap: Model.ModelsMap,
): ModelDeveloper.Item[] {
  return Object.values(modelsMap).map((developer) => ({
    id: developer.developer.id,
    name: developer.developer.meta?.name,
    logoUrl: developer.developer.meta?.logoUrl,
  }));
}

//#endregion

//#region Meta utils

export const modelDevelopersMeta: ModelDeveloper.MetaMap = {
  alibaba: {
    name: "Alibaba",
    websiteUrl: "https://www.alibabacloud.com",
  },
  amazon: {
    name: "Amazon",
    websiteUrl: "https://aws.amazon.com/bedrock",
  },
  anthropic: {
    name: "Anthropic",
    websiteUrl: "https://www.anthropic.com",
  },
  cohere: {
    name: "Cohere",
    websiteUrl: "https://cohere.ai",
  },
  deepseek: {
    name: "Deepseek",
    websiteUrl: "https://www.deepseek.com/",
  },
  google: {
    name: "Google",
    websiteUrl: "https://ai.google/",
  },
  inception: {
    name: "Inception",
    websiteUrl: "https://www.inceptionlabs.ai/",
  },
  meituan: {
    name: "Meituan",
    websiteUrl: "https://github.com/meituan-longcat",
  },
  meta: {
    name: "Meta",
    websiteUrl: "https://ai.meta.com",
  },
  mistral: {
    name: "Mistral",
    websiteUrl: "https://mistral.ai",
  },
  minimax: {
    name: "MiniMax",
    websiteUrl: "https://www.minimax.io/",
  },
  moonshotai: {
    name: "Moonshot AI",
    websiteUrl: "https://www.moonshot.ai/",
  },
  morph: {
    name: "Morph",
    websiteUrl: "https://www.morphllm.com/",
  },
  openai: {
    name: "OpenAI",
    websiteUrl: "https://openai.com",
  },
  perplexity: {
    name: "Perplexity",
    websiteUrl: "https://www.perplexity.ai/api-platform",
  },
  stealth: {
    name: "Stealth",
    websiteUrl: undefined,
  },
  vercel: {
    name: "Vercel",
    websiteUrl: "https://vercel.com/ai",
  },
  voyage: {
    name: "Voyage",
    websiteUrl: "https://www.voyage.ai",
  },
  xai: {
    name: "xAI",
    websiteUrl: "https://x.ai",
  },
  zai: {
    name: "Z.ai",
    websiteUrl: "https://z.ai/model-api",
  },
};

// Add logo URLs from Models.dev
for (const developerId in modelDevelopersMeta) {
  const id = developerId as ModelDeveloper.Id;
  const developer = modelDevelopersMeta[id];
  developer.logoUrl = modelsDotdevLogoUrl(id);
}

//#endregion

//#endregion
