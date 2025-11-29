import { buildDatasetSelection, DatasetSelection } from "@wrkspc/core/dataset";
import { Tabs } from "@wrkspc/ds";
import iconRegularTableRows from "@wrkspc/icons/svg/regular/table-rows.js";
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
    <div className="flex flex-col gap-2 pb-4">
      <Tabs
        label={{ icon: iconRegularTableRows, label: "Rows to use:" }}
        size="xsmall"
        items={[
          { id: "row", label: "Single" },
          { id: "range", label: "Range" },
          { id: "all", label: "All" },
        ]}
        onChange={(type) => selectionField.set(buildDatasetSelection(type))}
      />

      <div className="pt-2">
        <DatasetSelectionContent selectionField={selectionField} rows={rows} />
      </div>
    </div>
  );
}
