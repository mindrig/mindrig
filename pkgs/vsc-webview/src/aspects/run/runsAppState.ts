import { Run } from "@wrkspc/core/run";

export interface RunsAppState {
  runs: RunsAppState.Runs;
}

export namespace RunsAppState {
  export type Runs = Record<Run.Id, Run>;
}

export function buildRunsAppState(): RunsAppState {
  return {
    runs: {},
  };
}
