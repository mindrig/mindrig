import { DatasetCsv, DatasetRequest } from "@wrkspc/core/dataset";
import { EditorFile } from "@wrkspc/core/editor";

export interface DatasetDatasourceState {
  csv: DatasetDatasourceState.Csv | null;
}

export namespace DatasetDatasourceState {
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

export function buildDatasetDatasourceState(
  overrides: Partial<DatasetDatasourceState> = {},
): DatasetDatasourceState {
  return {
    csv: null,
  };
}
