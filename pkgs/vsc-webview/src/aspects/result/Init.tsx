import { Result } from "@wrkspc/core/result";
import { Button } from "@wrkspc/ds";
import { State } from "enso";
import { useState } from "react";

export namespace ResultInit {
  export interface Props {
    state: State<Result.Init>;
  }
}

export function ResultInit(props: ResultInit.Props) {
  const { state } = props;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium">Model Settings</h5>

        <Button
          size="xsmall"
          style="transparent"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Hide response" : "Show response"}
        </Button>
      </div>

      {expanded && (
        <div className="p-3 rounded border overflow-auto">
          TODO: Render init particulars
        </div>
      )}
    </div>
  );
}
