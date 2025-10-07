import type { ModelDeveloper, ModelSettings } from "../model/index.js";

export interface AssessmentSetup {
  ref: AssessmentSetup.Ref;
  settings: ModelSettings;
}

export namespace AssessmentSetup {
  export type Ref = RefDeveloper | RefModel;

  export interface RefDeveloper {
    developerId: ModelDeveloper.Id | null;
  }

  export interface RefModel {
    developerId: ModelDeveloper.Id;
    modelId: string | null;
  }
}

export function buildAssessmentSetup(): AssessmentSetup {
  return {
    ref: {
      developerId: null,
    },
    settings: {},
  };
}
