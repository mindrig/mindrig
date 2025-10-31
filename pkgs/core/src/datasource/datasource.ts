import { buildDatasetDatasource, DatasetDatasource } from "../dataset";
import { buildDatasourceManual, DatasourceManual } from "./manual";

export type Datasource = Datasource.V1;

export namespace Datasource {
  export type V1 = DatasourceManual.V1 | DatasetDatasource.V1;

  export type Type = V1["type"];

  // export interface V1 extends Versioned<1> {
  //   source: "manual" | "dataset";
  //   datasetMode: DatasetSelection.Type;
  //   selectedRowIdx: number | null;
  //   range?: RangeV1;
  //   totalRows: number;
  // }

  // export interface Manual extends Versioned<1> {
  //   source: "manual" | "dataset";
  //   datasetMode: DatasetSelection.Type;
  //   selectedRowIdx: number | null;
  //   range?: RangeV1;
  //   totalRows: number;
  // }

  // export interface RangeV1 extends Versioned<1> {
  //   start: number;
  //   end: number;
  // }

  // export type Type = Datasource["source"];
}

export function buildDatasource(type: Datasource.Type): Datasource {
  switch (type) {
    case "dataset":
      return buildDatasetDatasource();
    case "manual":
      return buildDatasourceManual();
  }
}
