import { always } from "alwaysly";
import { ModelDeveloper } from "./developer";
import { asModelId, Model } from "./model";

export namespace ModelOrder {
  export type DeveloperWeights = Partial<{
    [Key in ModelDeveloper.Id]: number;
  }>;

  export type DeveloperModelWeights = Partial<{
    [Id in ModelDeveloper.Id]: ModelWeights;
  }>;

  export type DeveloperModelWeightsStrict = {
    [Id in WeightedDeveloperId]: ModelWeights;
  };

  export type ModelWeights = {
    [Id: Model.Id]: number;
  };

  export type WeightedDeveloperId = keyof typeof modelDeveloperOrderWeights;
}

//#region Weights

const modelDeveloperOrderWeights = {
  openai: 100,
  anthropic: 90,
  google: 80,
  meta: 70,
} satisfies ModelOrder.DeveloperWeights;

export const MODEL_DEVELOPER_ORDER_WEIGHTS: ModelOrder.DeveloperWeights =
  modelDeveloperOrderWeights;

const modelOrderWeights: ModelOrder.DeveloperModelWeightsStrict = {
  openai: {
    [asModelId("gpt-5.1-thinking")]: 100,
    [asModelId("gpt-5-mini")]: 90,
    [asModelId("gpt-5-nano")]: 80,
  },
  anthropic: {
    [asModelId("claude-sonnet-4.5")]: 100,
    [asModelId("claude-haiku-4.5")]: 90,
    [asModelId("claude-opus-4.1")]: 80,
  },
  google: {
    [asModelId("gemini-3-pro-preview")]: 100,
    [asModelId("gemini-2.5-pro")]: 90,
    [asModelId("gemini-2.5-flash")]: 80,
    [asModelId("gemini-2.5-flash-lite")]: 70,
  },
  meta: {
    [asModelId("llama-4-scout")]: 100,
    [asModelId("llama-4-maverick")]: 90,
    [asModelId("llama-3.3-70b")]: 80,
  },
};

export const MODEL_ORDER_WEIGHTS: ModelOrder.DeveloperModelWeights =
  modelOrderWeights;

const defaultModelDDeveloperEntry = Object.entries(
  MODEL_DEVELOPER_ORDER_WEIGHTS,
).sort(([, orderA], [, orderB]) => orderB - orderA)[0];
always(defaultModelDDeveloperEntry);

export const DEFAULT_MODEL_DEVELOPER_ID =
  defaultModelDDeveloperEntry[0] as ModelDeveloper.Id;

export function buildModelOrder(
  ref: Model.Ref,
  meta: Model.MetaValue,
): number | undefined {
  const weight = MODEL_ORDER_WEIGHTS[ref.developerId]?.[ref.modelId];
  if (weight) return weight;
  if (!meta?.releasedAt) return;
  const date = new Date(meta.releasedAt);
  const time = +date;
  if (isNaN(time)) return;
  return +`0.${time}`;
}

//#endregion

//#region Sorting

export function sortModelsMap(map: Model.ModelsMap): Model.ModelsMap {
  const sortedMap: Partial<Model.ModelsMap> = {};

  const developerEntries = Object.entries(map) as [
    ModelDeveloper.Id,
    Model.ModelsMapDeveloper,
  ][];
  developerEntries.sort(
    ([, developerA], [, developerB]) =>
      (developerB.developer.order || 0) - (developerA.developer.order || 0),
  );

  developerEntries.forEach(([developerId, developerMap]) => {
    sortedMap[developerId] = sortModelsMapDeveloper(developerMap);
  });
  return sortedMap as Model.ModelsMap;
}

export function sortModelsMapDeveloper(
  mapDeveloper: Model.ModelsMapDeveloper,
): Model.ModelsMapDeveloper {
  const sortedMapDeveloper = { ...mapDeveloper };
  sortedMapDeveloper.models = sortModels(sortedMapDeveloper.models);
  return sortedMapDeveloper;
}

export function sortModels(models: Model[]): Model[] {
  const sortedModels = [...models];
  sortedModels.sort(
    (modelA, modelB) => (modelB.order || 0) - (modelA.order || 0),
  );
  return sortedModels;
}

//#endregion
