import { FileLabel } from "@/aspects/file/Label";
import { LanguageIcon } from "@/aspects/language/Icon";
import { Prompt } from "@mindcontrol/code-types";
import { SyncFile } from "@mindcontrol/vscode-sync";
import { Select } from "@wrkspc/form";

export namespace FileHeader {
  export interface Props {
    fileState: SyncFile.State | null;
    pinnedFile?: SyncFile.State | null;
    activeFile?: SyncFile.State | null;
    isPinned?: boolean;
    parseStatus?: "success" | "error";
    parseError?: string | null;
    prompts: Prompt[];
    promptIdx: number | undefined;
    onPin?: () => void;
    onUnpin?: () => void;
  }
}

export function FileHeader(props: FileHeader.Props) {
  const {
    fileState,
    pinnedFile,
    activeFile,
    isPinned = false,
    parseStatus = "success",
    parseError,
    onPin,
    onUnpin,
    prompts,
    promptIdx,
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

  const renderFileCard = (
    file: SyncFile.State,
    title: string,
    isPinnedView: boolean,
  ) => {
    if (!file) return null;

    const relativePath = file.path.includes("/")
      ? file.path.split("/").slice(-2).join("/")
      : file.path;

    const hasError = parseStatus === "error" && !isPinnedView;
    const borderClass = isPinnedView
      ? "border-blue-600"
      : hasError
        ? "border-red-300"
        : "border-gray-100";

    return (
      <div className={`bg-white rounded-lg p-4 border ${borderClass}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 mr-2 min-w-0 flex-1">
            <LanguageIcon id={file.languageId} size="small" />

            <h3
              className="font-semibold text-gray-800 truncate"
              title={file.path}
            >
              {relativePath}
            </h3>
            {hasError && (
              <span
                className="text-red-500 text-sm flex-shrink-0"
                title={parseError || "Parse error"}
              >
                ⚠️
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {file.isDirty && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                Unsaved
              </span>
            )}

            <button
              onClick={isPinnedView ? onUnpin : onPin}
              disabled={!file}
              className="px-2 py-1 text-xs border border-gray-300 hover:border-gray-400 rounded transition-colors bg-transparent text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPinnedView ? "Unpin" : "Pin"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {file.content.split("\n").length} lines
            {file.cursor && (
              <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded">
                Ln {file.cursor.line}, Col {file.cursor.character}
                {file.cursor.offset !== undefined && (
                  <span className="ml-1 text-gray-600">
                    (offset: {file.cursor.offset})
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
      {displayFile && (
        <div className="flex items-center justify-between gap-2">
          <FileLabel file={displayFile} />

          <Select
            label={{ a11y: "Select prompt" }}
            size="xsmall"
            selectedKey={promptIdx ?? null}
            options={prompts.map((prompt, index) => ({
              label: prompt.exp.slice(0, 15),
              value: index,
            }))}
            placeholder={prompts.length ? "Select prompt" : "No prompts"}
            isDisabled={!prompts.length}
            onSelectionChange={(idx) => {
              if (idx === null) return;
              const index = Number(idx);
              const prompt = prompts[index];
              if (!prompt) return;

              const vscode = (window as any).__vscode;
              if (!vscode) return;

              vscode.postMessage({
                type: "revealPrompt",
                payload: {
                  file: prompt.file,
                  selection: {
                    start: prompt.span.inner.start,
                    end: prompt.span.inner.end,
                  },
                },
              });
            }}
          />
        </div>
      )}

      {/*
      {isPinned && activeFile && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-600 text-xs">Current Active File:</span>
            <span className="text-xs font-medium text-gray-800">
              {activeFile.path.split("/").pop()}
            </span>
            {activeFile.cursor && (
              <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                Ln {activeFile.cursor.line}, Col {activeFile.cursor.character}
              </span>
            )}
          </div>
        </div>
      )}

      {isPinned && pinnedFile && renderFileCard(pinnedFile, "Pinned", true)}

      {!isPinned && displayFile && renderFileCard(displayFile, "Active", false)} */}
    </div>
  );
}
