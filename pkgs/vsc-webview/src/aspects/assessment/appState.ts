import { PlaygroundMap } from "@wrkspc/core/playground";
import { buildSetupsAppState, SetupsAppState } from "../setup/setupsAppState";

export interface AssessmentAppState {
  setups: SetupsAppState;
}

export namespace AssessmentAppState {
  export type Store = {
    [Key in `assessments.${PlaygroundMap.PromptId}`]: AssessmentAppState;
  };
}

export function buildAssessmentAppState(): AssessmentAppState {
  return {
    setups: buildSetupsAppState(),
  };
}
