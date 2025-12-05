import { AuthAppState } from "@/aspects/auth/appState";
import { DatasetDatasourceAppState } from "@/aspects/dataset/datasource/appState";
import { ModelsAppState } from "@/aspects/model/modelsAppState";
import { ResultAppState } from "@/aspects/result/appState";
import { ResultsAppState } from "@/aspects/result/resultsAppState";
import { RunAppState } from "@/aspects/run/appState";
import { SetupAppState } from "@/aspects/setup/appState";
import { Csv } from "@wrkspc/core/csv";
import { Datasource } from "@wrkspc/core/datasource";
import { EditorFile } from "@wrkspc/core/editor";
import { PlaygroundMap } from "@wrkspc/core/playground";
import { Result } from "@wrkspc/core/result";
import { Run } from "@wrkspc/core/run";
import { Setup } from "@wrkspc/core/setup";
import { Test } from "@wrkspc/core/test";
import { AssessmentAppState } from "../../assessment/appState";
import { TestAppState } from "../../test/appState";

export interface AppState {
  auth: AuthAppState | undefined;
  models: AppState.Models;
  assessments: AppState.Assessments;
  tests: AppState.Tests;
  runs: AppState.Runs;
  results: AppState.Results;
  csvs: AppState.Csvs;
  datasetDatasources: AppState.DatasetDatasources;
  setups: AppState.Setups;
}

export namespace AppState {
  export interface Models {
    gateway: ModelsAppState.Gateway;
    dotdev: ModelsAppState.Dotdev;
  }

  export type Assessments = Record<PlaygroundMap.PromptId, AssessmentAppState>;

  export type Tests = Record<Test.Id, TestAppState>;

  export type Runs = Record<Run.Id, RunAppState>;

  export type Results = Record<Run.Id, ResultsAppState> &
    Record<Result.Id, ResultAppState>;

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

  export type Setups = Record<Setup.Id, SetupAppState>;
}

export function buildAppState(): AppState {
  return {
    auth: undefined,
    models: {
      gateway: { waiting: true, payload: undefined },
      dotdev: { waiting: true, payload: undefined },
    },
    assessments: {},
    tests: {},
    runs: {},
    results: {},
    csvs: {
      requests: {},
      data: {},
    },
    datasetDatasources: {},
    setups: {},
  };
}
