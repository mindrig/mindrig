import { Result } from "@wrkspc/core/result";
import { Button } from "@wrkspc/ds";
import { State } from "enso";
import { useState } from "react";
import { DatasourceInputsPreview } from "../datasource/InputsPreview";
import { useRun } from "../run/Context";
import { SetupPreview } from "../setup/Preview";

export namespace ResultInitPreview {
  export interface Props {
    resultInitState: State<Result.Init>;
  }
}

export function ResultInitPreview(props: ResultInitPreview.Props) {
  const { resultInitState } = props;
  const [expanded, setExpanded] = useState(false);

  const { run } = useRun();
  const runInit = run.useInit();
  const resultInit = resultInitState.useValue();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium">Result Init</h5>

        <Button
          size="xsmall"
          style="transparent"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Hide result init" : "Show result init"}
        </Button>
      </div>

      {expanded && (
        <div className="p-3 rounded border overflow-auto">
          <SetupPreview setup={resultInit.setup} />

          <DatasourceInputsPreview
            inputs={resultInit.datasources}
            runInit={runInit}
          />
        </div>
      )}
    </div>
  );
}
