import { useBlueprint } from "@/aspects/blueprint/Context";
import { Csv } from "@wrkspc/core/csv";
import { DatasetDatasource } from "@wrkspc/core/dataset";
import { Description, fieldCn, Label } from "@wrkspc/ui";
import { Field, State } from "enso";
import { DatasourceMappingEntries } from "../../datasource/MappingEntries";
import { DatasourceMappingEntryRow } from "../../datasource/MappingEntryRow";
import { DatasetDatasourceMappingEntry } from "./MappingEntry";

export namespace DatasetDatasourceMapping {
  export interface Props {
    csvState: State<Csv>;
    csvField: Field<DatasetDatasource.DataRefCsv>;
  }
}

export function DatasetDatasourceMapping(
  props: DatasetDatasourceMapping.Props,
) {
  const { csvState, csvField } = props;
  const { promptState } = useBlueprint();
  const mappingField = csvField.$.mapping.useCollection();
  const varsState = promptState.$.prompt.$.vars.useCollection();
  const headerState = csvState.$.header.useCollection();

  return (
    <div className="flex flex-col gap-3">
      <div className={fieldCn({ size: "xsmall" })}>
        <Label size="xsmall">Variables map</Label>

        <Description size="xsmall">
          Map CSV columns to prompt variables.
        </Description>
      </div>

      <DatasourceMappingEntries>
        <DatasourceMappingEntryRow>
          <Label size="xsmall">Variable</Label>
          <Label size="xsmall">Row</Label>
        </DatasourceMappingEntryRow>

        {varsState.map((varState) => (
          <DatasetDatasourceMappingEntry
            varState={varState}
            mappingField={mappingField}
            csvState={csvState}
            headerState={headerState}
            key={varState.id}
          />
        ))}
      </DatasourceMappingEntries>
    </div>
  );
}
