import type { Prompt } from "@mindcontrol/code-types";
import { SyncFile } from "@mindcontrol/vscode-sync";
import { Button } from "@wrkspc/ds";
import { useState } from "react";
import { CodeEditor } from "./CodeEditor";
import { SettingsPanel } from "./SettingsPanel";

export namespace DebugSection {
  export interface Props {
    vscode: {
      postMessage: (message: any) => void;
      getState: () => any;
      setState: (state: any) => void;
    } | null;
    settings: {
      enableFileTracking: boolean;
      showFileContent: boolean;
    } | null;
    prompts: Prompt[];
    fileState: SyncFile.State | null;
    activeFile: SyncFile.State | null;
    onSyncMessage: (handler: (message: any) => void) => void;
  }
}

export function DebugSection(props: DebugSection.Props) {
  const { vscode, settings, prompts, fileState, activeFile, onSyncMessage } =
    props;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          size="small"
          style="transparent"
          color="secondary"
        >
          {isExpanded ? "Hide Debug" : "Show Debug"}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-4 border-t border-gray-200 pt-4">
          {(activeFile?.path || fileState?.path) && (
            <CodeEditor
              vscode={vscode}
              resourcePath={(activeFile?.path || fileState?.path)!}
              onSyncMessage={onSyncMessage}
            />
          )}

          {(fileState || activeFile) && (
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <h4 className="text-sm font-medium text-gray-700">
                  Detected Prompts ({prompts.length})
                </h4>
              </div>
              <div className="p-4">
                <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-300 overflow-x-auto max-h-64 overflow-y-auto">
                  <div className="bg-gray-50 text-gray-900">
                    {JSON.stringify(prompts, null, 2)}
                  </div>
                </pre>
              </div>
            </div>
          )}

          <SettingsPanel settings={settings} />
        </div>
      )}
    </div>
  );
}
