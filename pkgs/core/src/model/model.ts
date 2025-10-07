import { never } from "alwaysly";
import { buildModelDeveloper, ModelDeveloper } from "./developer";
import {
  buildDotdevModelCapabilities,
  buildDotdevModelMeta,
  findDotdevModel,
  ModelDotdev,
} from "./dotdev";
import { ModelGateway } from "./gateway";
import {
  buildVercelGatewayModel,
  buildVercelModelAccess,
  buildVercelModelPricing,
  ModelVercel,
  parseVercelModelId,
} from "./vercel";

export interface Model {
  id: Model.Id;
  name: string;
  description: string | undefined;
  type: Model.TypeValue;
  pricing: Model.PricingValue;
  /** The information required for the gateway to access the provider. */
  access: Model.Access;
  /** Model meta information. `undefined` if not resolved, `null` if
   * not available. */
  meta: Model.MetaValue;
  /** Order weight, if defined will be used for sorting. Otherwise, it will be
   * sorted by name. */
  order: number | undefined;
}

export namespace Model {
  //#region Ids

  export type Id = string & { [idBrand]: true };
  declare const idBrand: unique symbol;

  //#endregion

  //#region Type

  export type Type = TypeLanguage | TypeEmbedding | TypeImage;

  export type TypeType = Type["type"];

  export type TypeValue = Type | undefined | null;

  //#region Language type

  export interface TypeLanguage {
    type: "language";
    /** Model capabilities information. `undefined` if not resolved, `null` if
     * not available. */
    capabilities: TypeLanguageCapabilitiesValue;
  }

  export interface TypeLanguageCapabilities {
    /** Supported modalities. */
    modalities: TypeLanguageModalities;
    /** Supports attachments. */
    attachment: boolean;
    /** Supports tool call. */
    toolCall: boolean;
    /** Supports reasoning. */
    reasoning: boolean;
    /** Supports temperature. */
    temperature: boolean;
  }

  export type TypeLanguageCapabilitiesValue =
    | TypeLanguageCapabilities
    | undefined
    | null;

  //#region Language type modality

  export type TypeLanguageModality =
    | "text"
    | "image"
    | "audio"
    | "video"
    | "pdf";

  export type TypeLanguageModalityInput = TypeLanguageModality;

  export type TypeLanguageModalitiesInput =
    TypeLanguageModalitiesMap<TypeLanguageModalityInput>;

  // NOTE: We use `Extract` to make sure this type stays in sync with `Modality`.
  export type TypeLanguageModalityOutput = Extract<
    TypeLanguageModality,
    "text"
  >;

  export type TypeLanguageModalitiesOutput =
    TypeLanguageModalitiesMap<TypeLanguageModalityOutput>;

  export type TypeLanguageModalitiesMap<Modality extends string> = {
    [Key in Modality]?: boolean | undefined;
  };

  export interface TypeLanguageModalities {
    /** Supported input modalities. */
    input: TypeLanguageModalitiesInput;
    /** Supported output modalities. */
    output: TypeLanguageModalitiesOutput;
  }

  //#endregion

  //#endregion

  //#region Embedding type

  export interface TypeEmbedding {
    type: "embedding";
    /** Model capabilities information. `undefined` if not resolved, `null` if
     * not available. */
    capabilities: TypeEmbeddingCapabilities | undefined | null;
  }

  export interface TypeEmbeddingCapabilities {}

  //#endregion

  //#region Image type

  export interface TypeImage {
    type: "image";
    /** Model capabilities information. `undefined` if not resolved, `null` if
     * not available. */
    capabilities: TypeImageCapabilities | undefined | null;
  }

  export interface TypeImageCapabilities {}

  //#endregion

  //#endregion

  //#region Pricing

  export interface Pricing {
    /** Cost per input token in USD. */
    input: string;
    /** Cost per output token in USD. */
    output: string;
    /** Cache tokens price, only available if the model supports prompt caching. */
    cache?: PricingCacheValue;
  }

  export type PricingValue = Pricing | undefined | null;

  export interface PricingCache {
    /** Cost per input cache token in USD. */
    input?: string;
    /** Cost per input creation cache token in USD. */
    creationInput?: string;
  }

  export type PricingCacheValue = PricingCache | undefined;

  //#endregion

  //#region Limit

  export interface Limit {
    /** Maximum context tokens. */
    context: number;
    /** Maximum output tokens. */
    output: number;
  }

  //#endregion

  //#region Access

  export type Access = ModelVercel.Access;

  export type AccessType = Access["type"];

  //#endregion

  //#region Meta

  export interface Meta {
    /** ISO-8601 datetime string */
    releasedAt?: string | undefined;
    /** ISO-8601 datetime string */
    updatedAt?: string | undefined;
    limit?: Model.Limit | undefined;
    open: boolean;
  }

  export type MetaValue = Meta | undefined | null;

  //#endregion

  //#region Mapping

  export type ModelsMap = {
    [Key in ModelDeveloper.Id]: {
      developer: ModelDeveloper;
      models: Model[];
    };
  };

  export type ModelsMapValue = ModelsMap | undefined | null;

  export type Items = Item[];

  export interface Item {
    id: Id;
    name: string;
    access: Access;
  }

  //#endregion
}

//#region Utils

export function buildModelsMap(
  gateway: ModelGateway.ListResponseOk,
  dotdev: ModelDotdev.ListResponseOkValue,
): Model.ModelsMap {
  const map: Partial<Model.ModelsMap> = {};

  switch (gateway.type) {
    case "vercel": {
      for (const vercelModel of gateway.data.payload.models) {
        const [id] = parseVercelModelId(vercelModel);
        let developerItem =
          map[id] ||
          (map[id] = {
            developer: buildModelDeveloper(id),
            models: [],
          });

        developerItem.models.push(
          buildModel(buildVercelGatewayModel(vercelModel), dotdev),
        );
      }
      break;
    }

    default:
      gateway.type satisfies never;
  }

  return map as Model.ModelsMap;
}

export function mapModelItems(
  modelsMap: Model.ModelsMap,
  developerId: ModelDeveloper.Id,
): Model.Items {
  return modelsMap[developerId].models.map(mapModelItem);
}

export function mapModelItem(model: Model): Model.Item {
  return {
    id: model.id,
    name: model.name,
    access: model.access,
  };
}

export function buildModel(
  gatewayModel: ModelGateway.Model,
  dotdev: ModelDotdev.ListResponseOkValue,
): Model {
  let model: Model;
  switch (gatewayModel.type) {
    case "vercel": {
      const vercelModel = gatewayModel.payload;
      const [, id] = parseVercelModelId(vercelModel);
      const providerId = vercelModel.specification.provider;
      const dotdevModel = findDotdevModel(providerId, id, dotdev);
      const meta = buildDotdevModelMeta(dotdevModel);
      return {
        id,
        name: vercelModel.name,
        description: vercelModel.description || undefined,
        type:
          vercelModel.modelType &&
          buildModelType(vercelModel.modelType, dotdevModel),
        access: buildVercelModelAccess(vercelModel),
        pricing: buildVercelModelPricing(vercelModel),
        meta,
        order: buildModelOrder(meta),
      };
    }

    default:
      gatewayModel.type satisfies never;
      never();
  }
}

export function buildModelType(
  typeType: Model.TypeType,
  dotdevModel: ModelDotdev.ApiModelValue,
): Model.Type {
  switch (typeType) {
    case "language":
      return buildLanguageModelType(dotdevModel);

    case "embedding":
      return buildEmbeddingModelType(dotdevModel);

    case "image":
      return buildImageModelType(dotdevModel);

    default:
      typeType satisfies never;
      never();
  }
}

export function buildLanguageModelType(
  dotdevModel: ModelDotdev.ApiModelValue,
): Model.TypeLanguage {
  return {
    type: "language",
    capabilities: buildDotdevModelCapabilities(dotdevModel),
  };
}

export function buildEmbeddingModelType(
  _dotdevModel: ModelDotdev.ApiModelValue,
): Model.TypeEmbedding {
  return {
    type: "embedding",
    capabilities: {},
  };
}

export function buildImageModelType(
  _dotdevModel: ModelDotdev.ApiModelValue,
): Model.TypeImage {
  return {
    type: "image",
    capabilities: {},
  };
}

export function buildModelOrder(meta: Model.MetaValue): number | undefined {
  if (!meta?.releasedAt) return;
  const date = new Date(meta.releasedAt);
  const time = +date;
  if (isNaN(time)) return;
  return +`0.${time}`;
}

//#endregion
