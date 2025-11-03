import JsonView from "@uiw/react-json-view";

import { Result } from "@wrkspc/core/result";
import { State } from "enso";
import { shouldExpandNodeInitially } from "./jsonUtils";

export namespace ResultInit {
  export interface Props {
    state: State<Result.Init>;
    // settings: object | null;
    // collapsed: boolean;
    // onToggle: () => void;
  }
}

export function ResultInit(props: ResultInit.Props) {
  const { state } = props;
  // if (!settings) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium">Model Settings</h5>
        <button className="text-xs hover:underline" onClick={onToggle}>
          {collapsed ? "Show settings" : "Hide settings"}
        </button>
      </div>

      {!collapsed && (
        <div className="p-3 rounded border overflow-auto">
          <JsonView
            value={settings}
            displayObjectSize={false}
            shouldExpandNodeInitially={shouldExpandNodeInitially}
          />
        </div>
      )}
    </div>
  );
}
