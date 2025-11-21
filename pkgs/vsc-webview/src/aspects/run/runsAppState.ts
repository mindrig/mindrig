import { Run } from "@wrkspc/core/run";
import { ResultsAppState } from "../result/resultsAppState";
import { RunAppState } from "./appState";

export interface RunsAppState {
  runs: RunsAppState.Runs;
  results: RunsAppState.Results;
}

export namespace RunsAppState {
  export type Store = {
    [Key in `runs.${Run.Id}`]: RunAppState;
  } & {
    [Key in `runs.${Run.Id}.results`]: ResultsAppState;
  };

  export type Runs = Record<Run.Id, RunAppState>;

  export type Results = Record<Run.Id, ResultsAppState>;
}

export function buildRunsAppState(): RunsAppState {
  return {
    runs: {},
    results: {},
  };
}
