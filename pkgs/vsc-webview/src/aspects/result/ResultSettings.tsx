import JsonView from "@uiw/react-json-view";

import { shouldExpandNodeInitially } from "./jsonUtils";

export interface ResultSettingsProps {
  settings: object | null;
  collapsed: boolean;
  onToggle: () => void;
}

export function ResultSettings(props: ResultSettingsProps) {
  const { settings, collapsed, onToggle } = props;
  if (!settings) return null;

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
