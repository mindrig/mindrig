import { DatasetSelection } from "@wrkspc/core/dataset";
import { InputController } from "@wrkspc/ds";
import { Field } from "enso";

export namespace DatasetSelectionRow {
  export interface Props {
    selectionField: Field<DatasetSelection.Row>;
    rows: number;
  }
}

export function DatasetSelectionRow(props: DatasetSelectionRow.Props) {
  const { selectionField, rows } = props;

  return (
    <div>
      <InputController
        label="Row index"
        field={selectionField.$.index}
        type="number"
        min={1}
        max={rows}
      />
    </div>
  );
}
