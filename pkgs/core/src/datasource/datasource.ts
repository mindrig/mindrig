import { DatasetSelection } from "../dataset";

export interface Datasource {
  source: "manual" | "dataset";
  datasetMode: DatasetSelection.Type;
  selectedRowIdx: number | null;
  range?: { start: number; end: number };
  totalRows: number;
}

export namespace Datasource {
  export type Type = Datasource["source"];
}
