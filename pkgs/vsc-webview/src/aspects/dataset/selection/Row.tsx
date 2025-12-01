import { DatasetSelection } from "@wrkspc/core/dataset";
import { Description, fieldCn, InputController } from "@wrkspc/ds";
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
    <div className="flex flex-col gap-2">
      <div className={fieldCn({ size: "xsmall" })}>
        <div className="max-w-20">
          <InputController
            label="Row index"
            size="xsmall"
            field={selectionField.$.index}
            type="number"
            min={1}
            max={rows}
          />
        </div>

        <Description size="xsmall">Use the specified CSV row.</Description>
      </div>
    </div>
  );
}
