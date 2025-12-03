import { Result } from "@wrkspc/core/result";
import { Button, textCn } from "@wrkspc/ds";
import { State } from "enso";
import { useState } from "react";
import { JsonPreview } from "../json/Preview";

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
        <div className="">
          {payload ? (
            <JsonPreview value={payload} />
          ) : (
            <div className="p-3">
              <p
                className={textCn({
                  size: "small",
                })}
              >
                No request
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
