import { SetupsState } from "../setup/state";

export interface AssessmentState {
  setups: SetupsState;
}

export function buildAssessmentState(): AssessmentState {
  return {
    setups: {
      expandedSetupIndex: null,
    },
  };
}
