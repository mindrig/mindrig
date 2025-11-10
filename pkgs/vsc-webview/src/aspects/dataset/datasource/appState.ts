import { DatasetCsv, DatasetRequest } from "@wrkspc/core/dataset";
import { EditorFile } from "@wrkspc/core/editor";

export interface DatasetDatasourceAppState {
  csv: DatasetDatasourceAppState.Csv | null;
}

export namespace DatasetDatasourceAppState {
  export type Csv = CsvLoading | CsvLoaded | CsvError;

  export interface CsvLoading {
    status: "loading";
    requestId: DatasetRequest.CsvId;
    path?: EditorFile.Path | undefined;
  }

  export interface CsvLoaded {
    status: "loaded";
    meta: DatasetCsv.Meta;
  }

  export interface CsvError {
    status: "error";
    error: string;
  }
}

export function buildDatasetDatasourceAppState(
  overrides: Partial<DatasetDatasourceAppState> = {},
): DatasetDatasourceAppState {
  return {
    csv: null,
  };
}
