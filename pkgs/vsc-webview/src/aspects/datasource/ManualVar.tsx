import { Datasource } from "@wrkspc/core/datasource";
import { getPlaygroundMapVarExp, PlaygroundMap } from "@wrkspc/core/playground";
import { InputController } from "@wrkspc/ui";
import { Field, State } from "enso";
import { DatasourceMappingEntry } from "./MappingEntry";

export namespace DatasourceManualVar {
  export interface Props {
    varState: State.Immutable<PlaygroundMap.PromptVar>;
    valuesField: Field<Datasource.Values>;
  }
}

export function DatasourceManualVar(props: DatasourceManualVar.Props) {
  const { varState, valuesField } = props;
  const varId = varState.$.id.useValue();
  const exp = varState.useCompute((var_) => getPlaygroundMapVarExp(var_), []);
  const valueField = valuesField.at(varId);

  return (
    <DatasourceMappingEntry exp={exp}>
      <InputController label={{ a11y: exp }} field={valueField} size="xsmall" />
    </DatasourceMappingEntry>
  );
}
