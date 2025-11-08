import {
  buildSetupsClientState,
  SetupsClientState,
} from "../setup/clientState";

export interface AssessmentClientState {
  setups: SetupsClientState;
}

export function buildAssessmentClientState(): AssessmentClientState {
  return {
    setups: buildSetupsClientState(),
  };
}
