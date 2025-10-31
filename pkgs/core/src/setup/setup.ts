import {
  buildModelSettings,
  Model,
  ModelDeveloper,
  ModelSettings,
} from "../model";
import { Versioned } from "../versioned";

export type Setup = Setup.V1;

export namespace Setup {
  export interface V1 extends Versioned<1> {
    ref: Setup.Ref;
    settings: ModelSettings;
  }
  export type Ref = RefDeveloper | RefModel;

  export interface RefDeveloper extends Versioned<1> {
    developerId: ModelDeveloper.Id | null;
    modelId: null;
  }

  export interface RefModel extends Versioned<1> {
    developerId: ModelDeveloper.Id;
    modelId: Model.Id | null;
  }
}

export function buildSetup(): Setup {
  return {
    v: 1,
    ref: {
      v: 1,
      developerId: null,
      modelId: null,
    },
    settings: buildModelSettings(),
  };
}
