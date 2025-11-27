import { Datasource } from "@wrkspc/core/datasource";
import { PlaygroundMap } from "@wrkspc/core/playground";
import { Field, State } from "enso";
import { DatasourceManualNoVars } from "./ManualNoVars";
import { DatasourceManualVar } from "./ManualVar";

export namespace DatasourceManualValues {
  export interface Props {
    varsState: State.Immutable<readonly PlaygroundMap.PromptVarV1[], "bound">;
    valuesField: Field<Datasource.Values>;
  }
}

export function DatasourceManualValues(props: DatasourceManualValues.Props) {
  const { varsState, valuesField } = props;

  if (!varsState.size) return <DatasourceManualNoVars />;

  return (
    <div className="flex flex-col gap-2">
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
