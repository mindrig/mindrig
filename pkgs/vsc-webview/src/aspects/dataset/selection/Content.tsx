import { DatasetSelection } from "@wrkspc/core/dataset";
import { Field } from "enso";
import { DatasetSelectionRange } from "./Range";
import { DatasetSelectionRow } from "./Row";

export namespace DatasetSelectionContent {
  export interface Props {
    selectionField: Field<DatasetSelection>;
    rows: number;
  }
}

export function DatasetSelectionContent(props: DatasetSelectionContent.Props) {
  const { selectionField, rows } = props;

  const discriminatedSelection = selectionField.useDiscriminate("type");

  switch (discriminatedSelection.discriminator) {
    case "row":
      return (
        <DatasetSelectionRow
          selectionField={discriminatedSelection.field}
          rows={rows}
        />
      );

    case "range":
      return (
        <DatasetSelectionRange
          selectionField={discriminatedSelection.field}
          rows={rows}
        />
      );

    case "all":
      return null;

    default:
      discriminatedSelection satisfies never;
  }
}
