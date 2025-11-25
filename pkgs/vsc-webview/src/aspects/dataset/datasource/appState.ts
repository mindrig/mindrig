import { Csv } from "@wrkspc/core/csv";

export interface DatasetDatasourceAppState {
  requestId?: Csv.RequestId | undefined;
}

export namespace DatasetDatasourceAppState {
  export interface DataEmpty {
    status: "empty";
  }

  export interface DataRequested {
    status: "requested";
    requestId: Csv.RequestId;
  }
  // export type Csv = CsvLoading | CsvLoaded | CsvError;

  // export interface CsvLoading {
  //   status: "loading";
  //   requestId: DatasetRequest.CsvId;
  //   path?: EditorFile.Path | undefined;
  // }

  // export interface CsvLoaded {
  //   status: "loaded";
  //   meta: Csv.Data;
  // }

  // export interface CsvError {
  //   status: "error";
  //   error: string;
  // }
}

export function buildDatasetDatasourceAppState(
  overrides: Partial<DatasetDatasourceAppState> = {},
): DatasetDatasourceAppState {
  return {
    ...overrides,
  };
}
