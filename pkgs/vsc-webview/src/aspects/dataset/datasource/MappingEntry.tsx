import { Csv } from "@wrkspc/core/csv";
import { DatasetDatasource } from "@wrkspc/core/dataset";
import { PlaygroundMap } from "@wrkspc/core/playground";
import { SelectController } from "@wrkspc/form";
import { Field, State } from "enso";

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
    <div className="flex">
      <div>{varExp}:</div>

      <SelectController
        field={mappingIndexField}
        size="xsmall"
        label={{ a11y: `Select CSV column for variable ${varExp}` }}
        options={headerState.map((columnName, columnIndex) => ({
          label: columnName.value,
          value: columnIndex as Csv.ColumnIndex,
        }))}
      />
    </div>
  );
}
