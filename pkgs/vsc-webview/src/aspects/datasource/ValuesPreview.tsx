import { Datasource } from "@wrkspc/core/datasource";
import { getPlaygroundMapVarExp, PlaygroundMap } from "@wrkspc/core/playground";
import { always } from "alwaysly";

export namespace DatasourceValuesPreview {
  export interface Props {
    values: Datasource.Values;
    vars: readonly PlaygroundMap.PromptVar[];
  }
}

export function DatasourceValuesPreview(props: DatasourceValuesPreview.Props) {
  const { values, vars } = props;
  return (
    <div>
      {Object.entries(values).map(([varId, value]) => {
        const var_ = vars.find((var_) => var_.id === varId);
        always(var_);
        return (
          <div key={varId} className="flex gap-2">
            <div className="font-bold">{getPlaygroundMapVarExp(var_)}:</div>
            <div>{value}</div>
          </div>
        );
      })}
    </div>
  );
}
