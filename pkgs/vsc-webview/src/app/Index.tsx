import { useMessage, useOn } from "@/aspects/message/messageContext";
import { useVsc } from "@/aspects/vsc/Context";
import { Prompt } from "@mindrig/types";
import { findPromptAtCursor } from "@wrkspc/prompt";
import { SyncFile } from "@wrkspc/vsc-sync";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { VscMessagePrompts } from "@wrkspc/vsc-message";
import { AuthVercel } from "../aspects/auth/Vercel";
import { Blueprint } from "../aspects/blueprint/Blueprint";
import { DevDebug } from "../aspects/dev/DebugSection";
import { FileHeader } from "../aspects/file/Header";
import { Layout } from "./Layout";

type PinnedPromptState = {
  prompt: Prompt;
  promptIndex: number | null;
  file: SyncFile.State | null;
  filePath: string | null;
};

type WebviewState = {
  pinnedPrompt?: PinnedPromptState | null;
};

export function Index() {
  const { vsc } = useVsc();
  const { send } = useMessage();
  const [fileState, setFileState] = useState<SyncFile.State | null>(null);
  const [activeFile, setActiveFile] = useState<SyncFile.State | null>(null);
  const [vercelGatewayKey, setVercelGatewayKey] = useState<
    string | null | undefined
  >(undefined);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [parseStatus, setParseStatus] = useState<"success" | "error">(
    "success",
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [pinnedPrompt, setPinnedPrompt] = useState<PinnedPromptState | null>(
    () => {
      const persisted = (vsc.getState?.() as WebviewState | undefined) ?? {};
      return persisted.pinnedPrompt ?? null;
    },
  );
  const [vercelPanelOpenSignal, setVercelPanelOpenSignal] = useState(0);
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
    (nextFile: SyncFile.State | null) => {
      if (!nextFile || !pinnedPrompt) return;
      const targetPath = pinnedPrompt.filePath ?? pinnedPrompt.prompt.file;
      if (!targetPath || nextFile.path !== targetPath) return;

      const updated: PinnedPromptState = {
        ...pinnedPrompt,
        file: cloneFileState(nextFile),
        filePath: nextFile.path ?? pinnedPrompt.filePath ?? null,
      };

      persistPinnedPrompt(updated);
    },
    [pinnedPrompt, persistPinnedPrompt],
  );

  useEffect(() => {
    send({ type: "lifecycle-webview-ready" });
  }, [send]);

  const handleVercelGatewayKeyChange = (vercelGatewayKey: string) => {
    send({
      type: "auth-vercel-gateway-set",
      payload: vercelGatewayKey,
    });
  };

  const handleClearVercelGatewayKey = () => {
    send({ type: "auth-vercel-gateway-clear" });
  };

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
      prompt: clonePrompt(resolvedPrompt),
      promptIndex: resolvedPromptIndex ?? null,
      file: cloneFileState(resolvedFile),
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

  const handlePromptSelect = useCallback(
    (index: number) => {
      const selectedPrompt = prompts[index];
      if (!selectedPrompt) return;

      send({
        type: "prompts-reveal",
        payload: {
          file: selectedPrompt.file,
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
        prompt: clonePrompt(selectedPrompt),
        promptIndex: index,
        file: candidateFile ? cloneFileState(candidateFile) : null,
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

  const applyFileState = useCallback(
    (next: SyncFile.State | null) => {
      setFileState(next);
      setActiveFile(next);
      refreshPinnedFile(next);
    },
    [refreshPinnedFile],
  );

  const handlePromptsChange = useCallback(
    (
      payload: Extract<
        VscMessagePrompts,
        { type: "prompts-change" }
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
            prompt: clonePrompt(updatedPrompt),
          });
      }
    },
    [activeFile, pinnedPrompt, persistPinnedPrompt],
  );

  useOn(
    "file-active-change",
    (message) => {
      applyFileState(message.payload ?? null);
    },
    [applyFileState],
  );

  useOn(
    "file-content-change",
    (message) => {
      applyFileState(message.payload ?? null);
    },
    [applyFileState],
  );

  useOn(
    "file-save",
    (message) => {
      applyFileState(message.payload ?? null);
    },
    [applyFileState],
  );

  useOn(
    "file-cursor-change",
    (message) => {
      applyFileState(message.payload ?? null);
    },
    [applyFileState],
  );

  useOn(
    "auth-vercel-gateway-state",
    (message) => {
      setVercelGatewayKey(message.payload.vercelGatewayKey);
    },
    [],
  );

  useOn(
    "auth-panel-open",
    () => {
      setVercelPanelOpenSignal((n) => n + 1);
    },
    [],
  );

  useOn(
    "prompts-change",
    (message) => {
      handlePromptsChange(message.payload);
    },
    [handlePromptsChange],
  );
  return (
    <Layout>
      <div className="flex flex-col gap-2">
        <AuthVercel
          vercelGatewayKey={vercelGatewayKey ?? null}
          onVercelGatewayKeyChange={handleVercelGatewayKeyChange}
          onClearVercelGatewayKey={handleClearVercelGatewayKey}
          openSignal={vercelPanelOpenSignal}
        />

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
            vercelGatewayKey={vercelGatewayKey}
            promptIndex={resolvedPromptIndex ?? null}
            isPromptPinned={isPromptPinned}
          />
        )}

        <DevDebug
          prompts={prompts}
          fileState={fileState}
          activeFile={activeFile}
        />
      </div>
    </Layout>
  );
}

function clonePrompt(prompt: Prompt): Prompt {
  if (typeof structuredClone === "function") return structuredClone(prompt);
  return JSON.parse(JSON.stringify(prompt));
}

function cloneFileState(file: SyncFile.State): SyncFile.State {
  return {
    ...file,
    cursor: file.cursor ? { ...file.cursor } : undefined,
  };
}
