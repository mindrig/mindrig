import { DatasetDatasourceAppState } from "@/aspects/dataset/datasource/appState";
import { ResultsAppState } from "@/aspects/result/resultsAppState";
import { RunAppState } from "@/aspects/run/appState";
import { Csv } from "@wrkspc/core/csv";
import { Datasource } from "@wrkspc/core/datasource";
import { EditorFile } from "@wrkspc/core/editor";
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
  csvs: AppState.Csvs;
  datasetDatasources: AppState.DatasetDatasources;
}

export namespace AppState {
  export type Assessments = Record<PlaygroundMap.PromptId, AssessmentAppState>;

  export type Tests = Record<Test.Id, TestAppState>;

  export type Runs = Record<Run.Id, RunAppState>;

  export type Results = Record<Run.Id, ResultsAppState>;

  export interface Csvs {
    requests: CsvsRequests;
    data: CsvsData;
  }

  export type CsvsRequests = Record<Csv.RequestId, Csv.Request>;

  export type CsvsData = Record<EditorFile.Path, Csv>;

  export type DatasetDatasources = Record<
    Datasource.Id,
    DatasetDatasourceAppState
  >;
}

export function buildAppState(): AppState {
  return {
    assessments: {},
    tests: {},
    runs: {},
    results: {},
    csvs: {
      requests: {},
      data: {},
    },
    datasetDatasources: {},
  };
}
