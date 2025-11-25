import { useBlueprint } from "@/aspects/blueprint/Context";
import { Csv } from "@wrkspc/core/csv";
import { DatasetDatasource } from "@wrkspc/core/dataset";
import { Field, State } from "enso";
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
    <div>
      {varsState.map((varState) => (
        <DatasetDatasourceMappingEntry
          varState={varState}
          mappingField={mappingField}
          csvState={csvState}
          headerState={headerState}
          key={varState.id}
        />
      ))}
    </div>
  );
}
