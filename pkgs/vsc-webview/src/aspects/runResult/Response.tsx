import JsonView from "@uiw/react-json-view";

import { shouldExpandNodeInitially } from "./jsonUtils";

export namespace RunResultResponse {
  export interface Props {
    response: object | undefined | null;
    expanded: boolean;
    onToggle: () => void;
  }
}
export function RunResultResponse(props: RunResultResponse.Props) {
  const { response, expanded, onToggle } = props;
  if (!response) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <h6 className="text-xs font-medium">Response JSON</h6>
        <button className="text-xs hover:underline" onClick={onToggle}>
          {expanded ? "Hide response" : "Show response"}
        </button>
      </div>
      {expanded && (
        <div className="p-3 rounded border overflow-auto">
          <JsonView
            value={response}
            displayObjectSize={false}
            shouldExpandNodeInitially={shouldExpandNodeInitially}
          />
        </div>
      )}
    </div>
  );
}
