import { Versioned } from "../versioned";
import { buildDatasetSelectionRow, DatasetSelection } from "./selection";

export type DatasetDatasource = DatasetDatasource.V1;

export namespace DatasetDatasource {
  export interface V1 extends Versioned<1> {
    type: "dataset";
    selection: DatasetSelection.V1;
  }
}

export function buildDatasetDatasource(): DatasetDatasource {
  return {
    v: 1,
    type: "dataset",
    selection: buildDatasetSelectionRow(),
  };
}
