import type { Prompt } from "@mindcontrol/code-types";
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
    fileState: {
      path: string;
      content: string;
      isDirty: boolean;
      lastSaved?: Date;
      language: string;
      cursorPosition?: {
        line: number;
        character: number;
        offset?: number;
      };
    } | null;
    activeFile: {
      path: string;
      content: string;
      isDirty: boolean;
      lastSaved?: Date;
      language: string;
      cursorPosition?: {
        line: number;
        character: number;
        offset?: number;
      };
    } | null;
    onSyncMessage?: (handler: (message: any) => void) => void;
  }
}

export function DebugSection(props: DebugSection.Props) {
  const { vscode, settings, prompts, fileState, activeFile, onSyncMessage } =
    props;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-800 border border-gray-300 hover:border-gray-400 rounded transition-colors bg-transparent"
        >
          {isExpanded ? "Hide Debug" : "Show Debug"}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 border-t border-gray-200 pt-4">
          <CodeEditor vscode={vscode} onSyncMessage={onSyncMessage} />

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
