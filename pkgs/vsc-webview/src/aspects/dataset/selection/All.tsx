import { DatasetSelection } from "@wrkspc/core/dataset";
import { Field } from "enso";

export namespace DatasetSelectionAll {
  export interface Props {
    selectionField: Field<DatasetSelection.All>;
    rows: number;
  }
}

export function DatasetSelectionAll(props: DatasetSelectionAll.Props) {
  const { selectionField, rows } = props;
  return <div>Select all {rows} rows.</div>;
}
