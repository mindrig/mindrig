import { Csv } from "@wrkspc/core/csv";
import { DatasetDatasource } from "@wrkspc/core/dataset";
import { PlaygroundMap } from "@wrkspc/core/playground";
import { textCn } from "@wrkspc/ds";
import { SelectController } from "@wrkspc/ui";
import { Field, State } from "enso";
import { DatasourceMappingEntryRow } from "../../datasource/MappingEntryRow";

export namespace DatasetDatasourceMappingEntry {
  export interface Props {
    varState: State.Immutable<PlaygroundMap.PromptVar>;
    mappingField: Field<DatasetDatasource.CsvMapping>;
    csvState: State<Csv>;
    headerState: State<string[], "bound">;
  }
}

export function DatasetDatasourceMappingEntry(
  props: DatasetDatasourceMappingEntry.Props,
) {
  const { varState, mappingField, csvState, headerState } = props;
  const varId = varState.$.id.useValue();
  const varExp = varState.$.exp.useValue();

  const mappingIndexField = mappingField.at(varId);

  return (
    <DatasourceMappingEntryRow>
      <div className="truncate flex items-center" title={varExp}>
        <span className={textCn({ role: "label", size: "small", mono: true })}>
          {varExp}:
        </span>
      </div>

      <div className="max-w-50">
        <SelectController
          field={mappingIndexField}
          size="xsmall"
          label={{ a11y: `Select CSV column for variable ${varExp}` }}
          options={[
            // TODO:
            // 1. Allow specifying undefined values if the field allows
            // 2. Render empty label instead of falling back to value (use ?? instead of ||)
            // { label: "", value: undefined },
            ...headerState.map((columnName, columnIndex) => ({
              label: columnName.value,
              value: columnIndex as Csv.ColumnIndex,
            })),
          ]}
        />
      </div>
    </DatasourceMappingEntryRow>
  );
}
