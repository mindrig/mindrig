import { DatasetSelection } from "@wrkspc/core/dataset";
import { Description, fieldCn, InputController } from "@wrkspc/ds";
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
    <div className="flex flex-col gap-2">
      <div className={fieldCn({ size: "xsmall" })}>
        <div className="grid grid-cols-2 gap-2 max-w-40">
          <InputController
            label="From index"
            size="xsmall"
            field={spanField.$.start}
            type="number"
            min={1}
            max={rows}
          />

          <InputController
            label="To index"
            size="xsmall"
            field={spanField.$.end}
            type="number"
            min={1}
            max={rows}
          />
        </div>

        <Description size="xsmall">
          Use the specified CSV rows range. The range is inclusive.
        </Description>
      </div>
    </div>
  );
}
