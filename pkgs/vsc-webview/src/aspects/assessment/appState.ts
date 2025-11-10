import { buildSetupsAppState, SetupsAppState } from "../setup/setupsAppState";

export interface AssessmentAppState {
  setups: SetupsAppState;
}

export function buildAssessmentAppState(): AssessmentAppState {
  return {
    setups: buildSetupsAppState(),
  };
}
