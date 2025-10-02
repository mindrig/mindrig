import type { ModelDotdev } from "@wrkspc/model";

export type VscMessageModels =
  | VscMessageModels.GetModelsDev
  | VscMessageModels.ModelsDev;

export namespace VscMessageModels {
  export type Type = "models-dev-request" | "models-dev-response";

  export interface GetModelsDev {
    type: "models-dev-request";
    payload?: undefined;
  }

  export interface ModelsDev {
    type: "models-dev-response";
    payload:
      | {
          data: ModelDotdev.ModelsDev.Data;
        }
      | {
          error: string;
        };
  }
}
