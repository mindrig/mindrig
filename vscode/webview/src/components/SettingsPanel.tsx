export namespace SettingsPanel {
  export interface Props {
    settings: {
      exampleSetting: string;
      enableFileTracking: boolean;
      showFileContent: boolean;
      autoSaveIndicator: boolean;
    } | null;
  }
}

export function SettingsPanel(props: SettingsPanel.Props) {
  const { settings } = props;

  if (!settings)
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center text-gray-500">
          <div className="mb-2">⚙️</div>
          <p className="text-sm">Loading settings...</p>
        </div>
      </div>
    );

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span className="text-gray-600">⚙️</span>
        Extension Settings
      </h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-700">Example Setting</p>
            <p className="text-xs text-gray-500">Current configuration value</p>
          </div>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
            {settings.exampleSetting}
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-700">File Tracking</p>
            <p className="text-xs text-gray-500">Track active file changes</p>
          </div>
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${settings.enableFileTracking ? "bg-green-400" : "bg-gray-400"}`}
            ></div>
            <span className="text-xs text-gray-600">
              {settings.enableFileTracking ? "On" : "Off"}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-700">
              Show File Content
            </p>
            <p className="text-xs text-gray-500">
              Display file content preview
            </p>
          </div>
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${settings.showFileContent ? "bg-green-400" : "bg-gray-400"}`}
            ></div>
            <span className="text-xs text-gray-600">
              {settings.showFileContent ? "On" : "Off"}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center py-2">
          <div>
            <p className="text-sm font-medium text-gray-700">Save Indicator</p>
            <p className="text-xs text-gray-500">
              Show unsaved changes indicator
            </p>
          </div>
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${settings.autoSaveIndicator ? "bg-green-400" : "bg-gray-400"}`}
            ></div>
            <span className="text-xs text-gray-600">
              {settings.autoSaveIndicator ? "On" : "Off"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          💡 Change these settings in VS Code preferences
        </p>
      </div>
    </div>
  );
}
