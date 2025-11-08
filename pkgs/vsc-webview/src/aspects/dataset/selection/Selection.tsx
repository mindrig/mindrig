import { buildDatasetSelection, DatasetSelection } from "@wrkspc/core/dataset";
import { Tabs } from "@wrkspc/ds";
import { Field } from "enso";
import { DatasetSelectionContent } from "./Content";

export namespace DatasetSelectionComponent {
  export interface Props {
    selectionField: Field<DatasetSelection>;
    rows: number;
  }
}

export function DatasetSelectionComponent(
  props: DatasetSelectionComponent.Props,
) {
  const { selectionField, rows } = props;

  return (
    <div>
      <Tabs
        items={[
          { id: "row", label: "Row" },
          { id: "range", label: "Range" },
          { id: "all", label: "All" },
        ]}
        onChange={(type) => selectionField.set(buildDatasetSelection(type))}
      />

      <DatasetSelectionContent selectionField={selectionField} rows={rows} />
    </div>
  );
}
