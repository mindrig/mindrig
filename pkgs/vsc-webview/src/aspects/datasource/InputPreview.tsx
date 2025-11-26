import { Datasource } from "@wrkspc/core/datasource";
import { Run } from "@wrkspc/core/run";
import { always } from "alwaysly";
import { DatasourcePreview } from "./Preview";
import { DatasourceValuesPreview } from "./ValuesPreview";

export namespace DatasourceInputPreview {
  export interface Props {
    input: Datasource.Input;
    runInit: Run.Init;
  }
}

export function DatasourceInputPreview(props: DatasourceInputPreview.Props) {
  const { input, runInit } = props;

  const datasource = runInit.datasources.find(
    (datasource) => datasource.id === input.datasourceId,
  );
  always(datasource);

  return (
    <div>
      <DatasourcePreview datasource={datasource} />

      <DatasourceValuesPreview
        values={input.values}
        vars={runInit.prompt.vars}
      />
    </div>
  );
}
