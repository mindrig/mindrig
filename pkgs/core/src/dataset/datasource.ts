import { buildDatasourceId, Datasource } from "../datasource";
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
    id: Datasource.Id;
    data: DataRef | null;
  }

  export type DataRef = DataRefV1;

  export type DataRefV1 = DataRefCsvV1;

  export type DataRefCsv = DataRefCsvV1;

  export interface DataRefCsvV1 extends Versioned<1> {
    type: "csv";
    path: EditorFile.Path;
    selection: DatasetSelection.V1;
    mapping: Mapping;
  }

  export type Mapping = Record<ColumnIndex, PlaygroundMap.PromptVarId>;

  export type ItemRef = ItemRefV1;

  export interface ItemRefV1 extends Versioned<1> {
    type: "dataset";
    path: EditorFile.Path;
    row: RowIndex;
  }

  export interface Input {
    type: "dataset";
    data: DataRef;
    item: ItemRef;
    values: Datasource.Values;
  }
}

export function buildDatasetDatasource(
  overrides: Partial<DatasetDatasource> = {},
): DatasetDatasource {
  return {
    v: 1,
    type: "dataset",
    id: buildDatasourceId(),
    data: null,
    ...overrides,
  };
}
