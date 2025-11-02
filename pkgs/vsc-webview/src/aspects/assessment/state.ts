import { Run } from "@wrkspc/core/run";
import { buildSetupsState, SetupsState } from "../setup/state";

export interface AssessmentState {
  setups: SetupsState;
  runId: Run.Id | null;
}

export function buildAssessmentState(): AssessmentState {
  return {
    setups: buildSetupsState(),
    runId: null,
  };
}
