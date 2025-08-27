import type { Prompt } from "@mindcontrol/code-types";

export namespace ActiveFile {
  export interface Props {
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
    pinnedFile?: {
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
    activeFile?: {
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
    isPinned?: boolean;
    showContent?: boolean;
    prompts?: Prompt[];
    onPin?: () => void;
    onUnpin?: () => void;
  }
}

export function ActiveFile(props: ActiveFile.Props) {
  const {
    fileState,
    pinnedFile,
    activeFile,
    isPinned = false,
    showContent = true,
    prompts = [],
    onPin,
    onUnpin,
  } = props;

  const displayFile = isPinned ? pinnedFile : fileState;

  if (!displayFile && !activeFile)
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center text-gray-500">
          <div className="mb-2">📄</div>
          <p className="text-sm">No supported file open</p>
          <p className="text-xs text-gray-400 mt-1">
            Open a .ts, .tsx, .js, .jsx, .mjs, .mjsx, .cjs, or .cjsx file
          </p>
        </div>
      </div>
    );

  const renderFileCard = (file: any, title: string, isPinnedView: boolean) => {
    if (!file) return null;

    const fileName = file.path.split("/").pop() || file.path;
    const relativePath = file.path.includes("/")
      ? file.path.split("/").slice(-2).join("/")
      : file.path;

    return (
      <div
        className={`bg-white rounded-lg p-4 shadow-sm border ${isPinnedView ? "border-yellow-200 bg-yellow-50" : "border-gray-100"}`}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <span
              className={isPinnedView ? "text-yellow-600" : "text-blue-600"}
            >
              {isPinnedView ? "📌" : "📄"}
            </span>
            {fileName}
          </h3>
          <div className="flex items-center gap-2">
            {isPinnedView && (
              <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full">
                {title}
              </span>
            )}
            {file.isDirty && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                Unsaved
              </span>
            )}
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {file.language}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-2" title={file.path}>
          {relativePath}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {file.content.split("\n").length} lines
            {file.cursorPosition && (
              <span className="ml-2 px-2 py-1 bg-blue-50 text-blue-700 rounded">
                Ln {file.cursorPosition.line}, Col{" "}
                {file.cursorPosition.character}
                {file.cursorPosition.offset !== undefined && (
                  <span className="ml-1 text-blue-600">
                    (offset: {file.cursorPosition.offset})
                  </span>
                )}
              </span>
            )}
          </span>
          {file.lastSaved && (
            <span>
              Last saved: {new Date(file.lastSaved).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={isPinned ? onUnpin : onPin}
          disabled={!fileState}
          className={`px-3 py-1 text-xs rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            isPinned
              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
          }`}
        >
          {isPinned ? "📌 Unpin" : "📌 Pin"}
        </button>
      </div>

      {/* Show active file info when pinned - ALWAYS ON TOP */}
      {isPinned && activeFile && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600 text-xs">
              🎯 Current Active File:
            </span>
            <span className="text-xs font-medium text-blue-800">
              {activeFile.path.split("/").pop()}
            </span>
            {activeFile.cursorPosition && (
              <span className="px-2 py-1 bg-blue-200 text-blue-700 text-xs rounded">
                Ln {activeFile.cursorPosition.line}, Col{" "}
                {activeFile.cursorPosition.character}
              </span>
            )}
          </div>
        </div>
      )}

      {isPinned && pinnedFile && renderFileCard(pinnedFile, "Pinned", true)}

      {!isPinned && displayFile && renderFileCard(displayFile, "Active", false)}

      {showContent && (displayFile || activeFile) && (
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <h4 className="text-sm font-medium text-gray-700">
              {isPinned ? "Pinned File " : ""}Content Preview
              {isPinned && pinnedFile && (
                <span className="text-xs text-gray-500 ml-2">
                  ({pinnedFile.path.split("/").pop()})
                </span>
              )}
            </h4>
          </div>
          <div className="p-4">
            <pre className="text-xs text-gray-700 bg-gray-50 p-3 rounded border overflow-x-auto max-h-64 overflow-y-auto">
              <code>{displayFile?.content || "// Empty file"}</code>
            </pre>
          </div>
        </div>
      )}

      {(displayFile || activeFile) && (
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <h4 className="text-sm font-medium text-gray-700">
              Detected Prompts ({prompts.length})
            </h4>
          </div>
          <div className="p-4">
            <pre className="text-xs text-gray-700 bg-gray-50 p-3 rounded border overflow-x-auto max-h-64 overflow-y-auto">
              <code>{JSON.stringify(prompts, null, 2)}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
