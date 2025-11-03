import { buildModelSettings, Model, ModelSettings } from "../model";
import { Versioned } from "../versioned";

export type Setup = Setup.V1;

export namespace Setup {
  export interface V1 extends Versioned<1> {
    ref: Setup.Ref;
    settings: ModelSettings;
  }

  export type Ref = RefDeveloper | RefModel;

  export interface RefDeveloper
    extends Versioned<1>,
      Model.RefPartialDeveloper {}

  export interface RefModel extends Versioned<1>, Model.RefPartialModel {}
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
