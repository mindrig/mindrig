import { Assessment, buildAssessment } from "../assessment";
import { PlaygroundMap, PlaygroundState } from "../playground";
import { Run } from "../run";
import { Versioned } from "../versioned";

export type ClientStore = ClientStore.Prompts & ClientStore.PromptRuns;

export namespace ClientStore {
  export type Key = keyof ClientStore;

  //#region Records

  export type Prompts = {
    [Key in `playground.assessments.${PlaygroundMap.PromptId}`]?:
      | Versioned.Only<AssessmentV1>
      | undefined;
  };

  export type PromptRuns = {
    [Key in `playground.runs.${Run.Id}`]: Versioned.Only<RunV1>;
  };

  //#endregion

  //#region Versions

  // NOTE: Since we store those types in the client store which may persist
  // between different versions of the application, we need to version them.
  // While it's preferable to add new fields as optional, it is not always
  // possible.

  //#region V1

  export interface AssessmentV1 extends Versioned<1> {
    ref: PlaygroundState.Ref;
    assessment: Assessment;
  }

  export interface RunV1 extends Versioned<1> {
    ref: PlaygroundState.Ref;
    run: Run;
  }

  //#endregion

  //#endregion
}

export namespace BuildClientStoreAssessment {
  export type Overrides = Partial<Omit<ClientStore.AssessmentV1, "v" | "ref">> &
    WithRef;

  export interface WithRef {
    ref: PlaygroundState.Ref;
  }
}

export function buildClientStoreAssessment(
  overrides: BuildClientStoreAssessment.Overrides,
): ClientStore.AssessmentV1 {
  return {
    v: 1,
    assessment: buildAssessment(),
    ...overrides,
  };
}
