import { useMessages } from "@/aspects/message/Context";
import { useModels } from "@/aspects/model/Context";
import { useVsc } from "@/aspects/vsc/Context";
import { Prompt } from "@mindrig/types";
import { EditorFile } from "@wrkspc/core/editor";
import type { VscMessagePrompt } from "@wrkspc/core/message";
import { findPromptAtCursor } from "@wrkspc/core/prompt";
import { useCallback, useMemo, useState } from "react";
import { useApp } from "../app/hooks";
import { AppLayout } from "../app/Layout";
import { Blueprint } from "../blueprint/Blueprint";
import { FileHeader } from "../file/Header";

type PinnedPromptState = {
  prompt: Prompt;
  promptIndex: number | null;
  file: EditorFile | null;
  filePath: string | null;
};

type WebviewState = {
  pinnedPrompt?: PinnedPromptState | null;
};

export function PlaygroundPage() {
  const { vsc } = useVsc();
  const { send, useListen } = useMessages();
  const { navigateTo } = useApp();

  //#region Shared state

  const [fileState, setFileState] = useState<EditorFile | null>(null);
  const [activeFile, setActiveFile] = useState<EditorFile | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);

  //#endregion

  //#region Pin

  const [pinnedPrompt, setPinnedPrompt] = useState<PinnedPromptState | null>(
    () => {
      const persisted = (vsc.getState?.() as WebviewState | undefined) ?? {};
      return persisted.pinnedPrompt ?? null;
    },
  );
  const persistPinnedPrompt = useCallback(
    (next: PinnedPromptState | null) => {
      setPinnedPrompt(next);
      const previous = (vsc.getState?.() as WebviewState | undefined) ?? {};
      vsc.setState({ ...previous, pinnedPrompt: next });
    },
    [vsc],
  );
  const isPromptPinned = Boolean(pinnedPrompt);
  const refreshPinnedFile = useCallback(
    (nextFile: EditorFile | null) => {
      if (!nextFile || !pinnedPrompt) return;
      const targetPath = pinnedPrompt.filePath ?? pinnedPrompt.prompt.file;
      if (!targetPath || nextFile.path !== targetPath) return;

      const updated: PinnedPromptState = {
        ...pinnedPrompt,
        file: structuredClone(nextFile),
        filePath: nextFile.path ?? pinnedPrompt.filePath ?? null,
      };

      persistPinnedPrompt(updated);
    },
    [pinnedPrompt, persistPinnedPrompt],
  );

  //#endregion

  //#region Vars

  const { gateway } = useModels();

  const gatewayResolved = !!gateway.response;
  const showGatewayErrorBanner = gateway.response?.data.status === "error";
  // TODO: Figure out why did we need this.
  const showGatewayMissingBanner = false;
  const gatewayErrorMessage =
    gateway.response?.data.status === "error" && gateway.response.data.message;

  const targetFile = activeFile;
  const [cursorPromptIdx, cursorPrompt] = useMemo(() => {
    return findPromptAtCursor(prompts, targetFile?.cursor?.offset);
  }, [targetFile?.cursor?.offset, prompts]);
  const resolvedPrompt = isPromptPinned
    ? (pinnedPrompt?.prompt ?? null)
    : (cursorPrompt ?? null);
  const resolvedPromptIndex = isPromptPinned
    ? (pinnedPrompt?.promptIndex ?? null)
    : (cursorPromptIdx ?? null);
  const resolvedFile = isPromptPinned
    ? (pinnedPrompt?.file ?? null)
    : targetFile;
  const displayFile = resolvedFile ?? fileState;

  const pinToggleDisabled =
    !isPromptPinned && (!resolvedPrompt || !resolvedFile);

  const handleTogglePromptPin = useCallback(() => {
    if (isPromptPinned) {
      persistPinnedPrompt(null);
      return;
    }

    if (!resolvedPrompt || !resolvedFile) return;

    const snapshot: PinnedPromptState = {
      prompt: structuredClone(resolvedPrompt),
      promptIndex: resolvedPromptIndex ?? null,
      file: structuredClone(resolvedFile),
      filePath: resolvedFile.path ?? resolvedPrompt.file ?? null,
    };

    persistPinnedPrompt(snapshot);
  }, [
    isPromptPinned,
    persistPinnedPrompt,
    resolvedPrompt,
    resolvedPromptIndex,
    resolvedFile,
  ]);

  //#endregion

  //#region File state

  const applyFileState = useCallback(
    (next: EditorFile | null) => {
      setFileState(next);
      setActiveFile(next);
      refreshPinnedFile(next);
    },
    [refreshPinnedFile],
  );

  useListen(
    "editor-ext-active-change",
    (message) => {
      applyFileState(message.payload ?? null);
    },
    [applyFileState],
  );

  useListen(
    "editor-ext-file-update",
    (message) => {
      applyFileState(message.payload ?? null);
    },
    [applyFileState],
  );

  useListen(
    "editor-ext-file-save",
    (message) => {
      applyFileState(message.payload ?? null);
    },
    [applyFileState],
  );

  useListen(
    "editor-ext-cursor-update",
    (message) => {
      applyFileState(message.payload ?? null);
    },
    [applyFileState],
  );

  //#endregion

  //#region Prompts

  const [parseError, setParseError] = useState<string | null>(null);
  const [parseStatus, setParseStatus] = useState<"success" | "error">(
    "success",
  );

  const handlePromptsChange = useCallback(
    (
      payload: Extract<
        VscMessagePrompt,
        { type: "prompts-ext-update" }
      >["payload"],
    ) => {
      setPrompts(payload.prompts ?? []);
      setParseStatus(payload.parseStatus ?? "success");
      setParseError((payload.parseError as string | undefined) ?? null);

      if (
        pinnedPrompt &&
        pinnedPrompt.promptIndex !== null &&
        activeFile &&
        (pinnedPrompt.filePath ?? pinnedPrompt.prompt.file) === activeFile.path
      ) {
        const updatedPrompt = payload.prompts?.[pinnedPrompt.promptIndex];
        if (updatedPrompt)
          persistPinnedPrompt({
            ...pinnedPrompt,
            prompt: structuredClone(updatedPrompt),
          });
      }
    },
    [activeFile, pinnedPrompt, persistPinnedPrompt],
  );

  useListen(
    "prompts-ext-update",
    (message) => {
      handlePromptsChange(message.payload);
    },
    [handlePromptsChange],
  );

  //#endregion

  //#region Selection

  const handlePromptSelect = useCallback(
    (index: number) => {
      const selectedPrompt = prompts[index];
      if (!selectedPrompt) return;

      send({
        type: "prompts-wv-reveal",
        payload: {
          path: selectedPrompt.file,
          selection: {
            start: selectedPrompt.span.inner.start,
            end: selectedPrompt.span.inner.end,
          },
        },
      });

      if (!isPromptPinned) return;

      const candidateFile =
        activeFile && activeFile.path === selectedPrompt.file
          ? activeFile
          : fileState && fileState.path === selectedPrompt.file
            ? fileState
            : resolvedFile;

      const nextPinned: PinnedPromptState = {
        prompt: structuredClone(selectedPrompt),
        promptIndex: index,
        file: candidateFile ? structuredClone(candidateFile) : null,
        filePath:
          (candidateFile ? candidateFile.path : selectedPrompt.file) ?? null,
      };

      persistPinnedPrompt(nextPinned);
    },
    [
      prompts,
      send,
      isPromptPinned,
      activeFile,
      fileState,
      resolvedFile,
      persistPinnedPrompt,
    ],
  );

  //#endregion

  return (
    <AppLayout>
      <div className="flex flex-col gap-2">
        {gatewayResolved &&
          (showGatewayErrorBanner || showGatewayMissingBanner) && (
            <div
              className={
                showGatewayErrorBanner
                  ? "flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:flex-row md:items-center md:justify-between"
                  : "flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 md:flex-row md:items-center md:justify-between"
              }
            >
              <div className="space-y-1">
                <div
                  className={
                    showGatewayErrorBanner
                      ? "font-semibold text-red-700"
                      : "font-semibold text-amber-700"
                  }
                >
                  {showGatewayErrorBanner
                    ? "Vercel Gateway error"
                    : "Vercel Gateway key missing"}
                </div>
                <div
                  className={
                    showGatewayErrorBanner ? "text-red-600" : "text-amber-700"
                  }
                >
                  {showGatewayErrorBanner
                    ? gatewayErrorMessage
                    : "You are not authenticated with Vercel Gateway; LLM requests will fail until you add a key."}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {showGatewayErrorBanner && (
                  <button
                    onClick={gateway.refresh}
                    className="rounded-lg border border-red-500 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
                  >
                    Retry
                  </button>
                )}
                <button
                  onClick={() => navigateTo({ type: "auth" })}
                  className={
                    showGatewayErrorBanner
                      ? "rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                      : "rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
                  }
                >
                  {showGatewayErrorBanner ? "Update" : "Add key"}
                </button>
              </div>
            </div>
          )}

        <FileHeader
          prompts={prompts}
          promptIdx={resolvedPromptIndex ?? null}
          fileState={displayFile}
          isPinned={isPromptPinned}
          isPinDisabled={pinToggleDisabled}
          onTogglePromptPin={handleTogglePromptPin}
          onPromptSelect={handlePromptSelect}
        />

        {displayFile && resolvedPrompt && (
          <Blueprint
            file={displayFile}
            prompt={resolvedPrompt}
            vercelGatewayKey={null}
            promptIndex={resolvedPromptIndex ?? null}
            isPromptPinned={isPromptPinned}
          />
        )}
      </div>
    </AppLayout>
  );
}
