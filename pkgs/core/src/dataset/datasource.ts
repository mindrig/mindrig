import { EditorFile } from "../editor";
import { PlaygroundMap } from "../playground";
import { Versioned } from "../versioned";
import { DatasetSelection } from "./selection";

export type DatasetDatasource = DatasetDatasource.V1;

export namespace DatasetDatasource {
  export type ColumnIndex = number & { [columnIndexBrand]: true };
  declare const columnIndexBrand: unique symbol;

  export type RowIndex = number & { [rowIndexBrand]: true };
  declare const rowIndexBrand: unique symbol;

  export interface V1 extends Versioned<1> {
    type: "dataset";
    data: Data | null;
  }

  export type Data = DataCsv;

  export interface DataCsv extends Versioned<1> {
    type: "csv";
    path: EditorFile.Path;
    selection: DatasetSelection.V1;
    mapping: Mapping;
  }

  export type Mapping = Record<ColumnIndex, PlaygroundMap.PromptVarId>;
}

export function buildDatasetDatasource(
  overrides: Partial<DatasetDatasource> = {},
): DatasetDatasource {
  return {
    v: 1,
    type: "dataset",
    data: null,
    ...overrides,
  };
}
