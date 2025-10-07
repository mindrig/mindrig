import { buildAssessmentSetup, type AssessmentSetup } from "./setup.js";

export interface Assessment {
  attachments: [];
  setups: AssessmentSetup[];
  datasources: [];
}

export namespace Assessment {}

export function buildAssessment(overrides?: Partial<Assessment>): Assessment {
  return {
    attachments: [],
    setups: [buildAssessmentSetup()],
    datasources: [],
    ...overrides,
  };
}
