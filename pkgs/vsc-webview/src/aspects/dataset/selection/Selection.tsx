import { buildDatasetSelection, DatasetSelection } from "@wrkspc/core/dataset";
import { SelectController } from "@wrkspc/ds";
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

  const typeField = selectionField
    .useInto((selection) => selection.type, [])
    .from((type) => buildDatasetSelection(type), []);

  return (
    <>
      <div className="max-w-40">
        <SelectController
          size="xsmall"
          field={typeField}
          label="Rows  to use"
          options={[
            { value: "row", label: "Single row" },
            { value: "range", label: "Rows range" },
            { value: "all", label: `Use all ${rows} rows` },
          ]}
        />
      </div>

      {/* <Tabs
        label={{ icon: iconRegularTableRows, label: "Rows to use:" }}
        size="xsmall"
        items={[
          { id: "row", label: "Single" },
          { id: "range", label: "Range" },
          { id: "all", label: "All" },
        ]}
        onChange={(type) => selectionField.set(buildDatasetSelection(type))}
      /> */}

      <DatasetSelectionContent selectionField={selectionField} rows={rows} />
    </>
  );
}
