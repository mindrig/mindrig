import JsonView from "@uiw/react-json-view";

import { Result } from "@wrkspc/core/result";
import { Button } from "@wrkspc/ds";
import { State } from "enso";
import { useState } from "react";

export namespace ResultRequest {
  export interface Props {
    state: State<Result.Request> | State<Result.Request | null> | State<null>;
  }
}

export function ResultRequest(props: ResultRequest.Props) {
  const { state } = props;
  const [expanded, setExpanded] = useState(false);
  const payload = state.useCompute((response) => response?.payload, []);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <h6 className="text-xs font-medium">Request</h6>

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
          {payload ? (
            <JsonView
              value={payload}
              displayObjectSize={false}
              // shouldExpandNodeInitially={shouldExpandNodeInitially}
            />
          ) : (
            <div className="text-xs text-gray-500">No request</div>
          )}
        </div>
      )}
    </div>
  );
}
