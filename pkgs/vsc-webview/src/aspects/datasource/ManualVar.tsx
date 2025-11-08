import { DatasourceManual } from "@wrkspc/core/datasource";
import { PlaygroundMap } from "@wrkspc/core/playground";
import { InputController } from "@wrkspc/form";
import { Field, State } from "enso";

export namespace DatasourceManualVar {
  export interface Props {
    varState: State.Immutable<PlaygroundMap.PromptVarV1>;
    valuesField: Field<DatasourceManual.Values>;
  }
}

export function DatasourceManualVar(props: DatasourceManualVar.Props) {
  const { varState, valuesField } = props;
  const varId = varState.$.id.useValue();
  const exp = varState.$.exp.useValue();
  const valueField = valuesField.at(varId);

  return <InputController label={exp} field={valueField} size="small" />;
}
