import { ResultsAppState } from "@/aspects/result/resultsAppState";
import { RunAppState } from "@/aspects/run/appState";
import { PlaygroundMap } from "@wrkspc/core/playground";
import { Run } from "@wrkspc/core/run";
import { Test } from "@wrkspc/core/test";
import { AssessmentAppState } from "../../assessment/appState";
import { TestAppState } from "../../test/appState";

export interface AppState {
  assessments: AppState.Assessments;
  tests: AppState.Tests;
  runs: AppState.Runs;
  results: AppState.Results;
}

export namespace AppState {
  export type Assessments = Record<PlaygroundMap.PromptId, AssessmentAppState>;

  export type Tests = Record<Test.Id, TestAppState>;

  export type Runs = Record<Run.Id, RunAppState>;

  export type Results = Record<Run.Id, ResultsAppState>;
}

export function buildAppState(): AppState {
  return {
    assessments: {},
    tests: {},
    runs: {},
    results: {},
  };
}
