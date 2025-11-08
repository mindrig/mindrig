import { DatasetSelection } from "@wrkspc/core/dataset";
import { InputController } from "@wrkspc/ds";
import { Field } from "enso";

export namespace DatasetSelectionRange {
  export interface Props {
    selectionField: Field<DatasetSelection.Range>;
    rows: number;
  }
}

export function DatasetSelectionRange(props: DatasetSelectionRange.Props) {
  const { selectionField, rows } = props;

  const spanField = selectionField.$.span
    .useInto(
      (span) => ({ start: span?.start ?? null, end: span?.end ?? null }),
      [],
    )
    .from(
      (span) =>
        span.start !== null && span.end !== null
          ? { v: 1, start: span.start, end: span.end }
          : null,
      [],
    );

  return (
    <div>
      <InputController
        label="From row index"
        field={spanField.$.start}
        type="number"
        min={1}
        max={rows}
      />
      <span>...</span>
      <InputController
        label="To row index"
        field={spanField.$.end}
        type="number"
        min={1}
        max={rows}
      />
    </div>
  );
}
