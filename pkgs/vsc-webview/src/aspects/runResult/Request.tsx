import JsonView from "@uiw/react-json-view";

import { shouldExpandNodeInitially } from "./jsonUtils";

export namespace RunResultRequest {
  export interface Props {
    request: object | undefined | null;
    expanded: boolean;
    onToggle: () => void;
  }
}

export function RunResultRequest(props: RunResultRequest.Props) {
  const { request, expanded, onToggle } = props;
  if (!request) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <h6 className="text-xs font-medium">Request JSON</h6>
        <button className="text-xs hover:underline" onClick={onToggle}>
          {expanded ? "Hide request" : "Show request"}
        </button>
      </div>
      {expanded && (
        <div className="p-3 rounded border overflow-auto">
          <JsonView
            value={request}
            displayObjectSize={false}
            shouldExpandNodeInitially={shouldExpandNodeInitially}
          />
        </div>
      )}
    </div>
  );
}
