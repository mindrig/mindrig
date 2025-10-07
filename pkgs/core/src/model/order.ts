import { ModelDeveloper } from "./developer";
import { Model } from "./model";

export namespace ModelOrder {
  export type Weights<Id extends string> = {
    [Key in Id]?: number | undefined;
  };
}

export const modelDeveloperOrderWeights: ModelOrder.Weights<ModelDeveloper.Id> =
  {
    openai: 100,
    anthropic: 90,
    google: 80,
    meta: 70,
  };

export const modelOrderWeights: ModelOrder.Weights<Model.Id> = {};
