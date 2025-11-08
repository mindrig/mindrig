import { DatasetCsv, DatasetRequest } from "@wrkspc/core/dataset";
import { EditorFile } from "@wrkspc/core/editor";

export interface DatasetDatasourceClientState {
  csv: DatasetDatasourceClientState.Csv | null;
}

export namespace DatasetDatasourceClientState {
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

export function buildDatasetDatasourceClientState(
  overrides: Partial<DatasetDatasourceClientState> = {},
): DatasetDatasourceClientState {
  return {
    csv: null,
  };
}
