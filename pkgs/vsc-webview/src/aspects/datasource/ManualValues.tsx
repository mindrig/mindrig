import { Datasource } from "@wrkspc/core/datasource";
import { PlaygroundMap } from "@wrkspc/core/playground";
import { Label } from "@wrkspc/ui";
import { Field, State } from "enso";
import { DatasourceManualNoVars } from "./ManualNoVars";
import { DatasourceManualVar } from "./ManualVar";
import { DatasourceMappingEntries } from "./MappingEntries";
import { DatasourceMappingEntryRow } from "./MappingEntryRow";

export namespace DatasourceManualValues {
  export interface Props {
    varsState: State.Immutable<readonly PlaygroundMap.PromptVar[], "bound">;
    valuesField: Field<Datasource.Values>;
  }
}

export function DatasourceManualValues(props: DatasourceManualValues.Props) {
  const { varsState, valuesField } = props;

  if (!varsState.size) return <DatasourceManualNoVars />;

  return (
    <DatasourceMappingEntries>
      <DatasourceMappingEntryRow>
        <Label size="xsmall">Variable</Label>
        <Label size="xsmall">Value</Label>
      </DatasourceMappingEntryRow>

      {varsState.map((varState) => (
        <DatasourceManualVar
          key={varState.id}
          varState={varState}
          valuesField={valuesField}
        />
      ))}
    </DatasourceMappingEntries>
  );
}
