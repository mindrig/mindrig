import { Datasource } from "@wrkspc/core/datasource";
import { Run } from "@wrkspc/core/run";
import { DatasourceInputPreview } from "./InputPreview";

export namespace DatasourceInputsPreview {
  export interface Props {
    inputs: Datasource.Input[];
    runInit: Run.Init;
  }
}

export function DatasourceInputsPreview(props: DatasourceInputsPreview.Props) {
  const { inputs, runInit } = props;

  return (
    <div className="space-y-4">
      {inputs.map((input, index) => (
        <DatasourceInputPreview key={index} input={input} runInit={runInit} />
      ))}
    </div>
  );
}
