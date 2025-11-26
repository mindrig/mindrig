import { Datasource } from "@wrkspc/core/datasource";
import { PlaygroundMap } from "@wrkspc/core/playground";
import { Field, State } from "enso";
import { DatasourceManualVar } from "./ManualVar";

export namespace DatasourceManualValues {
  export interface Props {
    varsState: State.Immutable<readonly PlaygroundMap.PromptVarV1[], "bound">;
    valuesField: Field<Datasource.Values>;
  }
}

export function DatasourceManualValues(props: DatasourceManualValues.Props) {
  const { varsState, valuesField } = props;

  return (
    <div>
      {varsState.map((varState) => (
        <DatasourceManualVar
          key={varState.id}
          varState={varState}
          valuesField={valuesField}
        />
      ))}
    </div>
  );
}
