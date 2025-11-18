import { Result } from "@wrkspc/core/result";
import { Run } from "@wrkspc/core/run";

export interface RunsAppState {
  runs: RunsAppState.Runs;
  results: RunsAppState.Results;
}

export namespace RunsAppState {
  export type Runs = Record<Run.Id, Run>;

  export type Results = Record<Run.Id, Result[]>;
}

export function buildRunsAppState(): RunsAppState {
  return {
    runs: {},
    results: {},
  };
}
