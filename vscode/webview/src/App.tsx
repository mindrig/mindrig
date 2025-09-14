import { Prompt } from "@mindcontrol/code-types";
import { SyncFile } from "@mindcontrol/vscode-sync";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Blueprint } from "./aspects/blueprint/Blueprint";
import { FileHeader } from "./aspects/file/Header";
import { DebugSection } from "./components/DebugSection";
import { VercelGatewayPanel } from "./components/VercelGatewayPanel";

declare global {
  interface Window {
    acquireVsCodeApi: () => {
      postMessage: (message: any) => void;
      getState: () => any;
      setState: (state: any) => void;
    };
  }
}

export function App() {
  const [fileState, setFileState] = useState<SyncFile.State | null>(null);
  const [pinnedFile, setPinnedFile] = useState<SyncFile.State | null>(null);
  const [activeFile, setActiveFile] = useState<SyncFile.State | null>(null);
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [settings, setSettings] = useState<any>(null);
  const [vercelGatewayKey, setVercelGatewayKey] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [parseStatus, setParseStatus] = useState<"success" | "error">(
    "success",
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [vscode] = useState(() => {
    const existing = (window as any).__vscode;
    if (existing) return existing;
    const api = window.acquireVsCodeApi?.();
    if (api) (window as any).__vscode = api;
    return api;
  });
  const [syncMessageHandler, setSyncMessageHandler] = useState<
    ((message: any) => void) | null
  >(null);
  const [vercelPanelOpenSignal, setVercelPanelOpenSignal] = useState(0);

  useEffect(() => {
    if (!vscode) return;

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      switch (message.type) {
        case "activeFileChanged":
          setFileState(message.payload);
          setActiveFile(message.payload);
          break;
        case "fileContentChanged":
          setFileState(message.payload);
          setActiveFile(message.payload);
          break;
        case "fileSaved":
          setFileState(message.payload);
          setActiveFile(message.payload);
          break;
        case "cursorPositionChanged":
          setFileState(message.payload);
          setActiveFile(message.payload);
          break;
        case "pinStateChanged":
          setPinnedFile(message.payload.pinnedFile);
          setActiveFile(message.payload.activeFile);
          setIsPinned(message.payload.isPinned);
          if (message.payload.isPinned)
            setFileState(message.payload.pinnedFile);
          else setFileState(message.payload.activeFile);

          break;
        case "settingsChanged":
          setSettings(message.payload);
          break;
        case "vercelGatewayKeyChanged":
          setVercelGatewayKey(message.payload.vercelGatewayKey);
          break;
        case "openVercelGatewayPanel":
          setVercelPanelOpenSignal((n) => n + 1);
          break;
        case "promptsChanged":
          setPrompts(message.payload.prompts);
          setParseStatus(message.payload.parseStatus || "success");
          setParseError(message.payload.parseError || null);
          break;
        case "sync-update":
        case "sync-state-vector":
          if (syncMessageHandler) syncMessageHandler(message);
          break;
      }
    };

    window.addEventListener("message", handleMessage);

    vscode.postMessage({ type: "webviewReady" });

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [vscode, syncMessageHandler]);

  const handlePin = () => {
    if (vscode) vscode.postMessage({ type: "pinFile" });
  };

  const handleUnpin = () => {
    if (vscode) vscode.postMessage({ type: "unpinFile" });
  };

  const handleVercelGatewayKeyChange = (vercelGatewayKey: string) => {
    if (vscode)
      vscode.postMessage({
        type: "setVercelGatewayKey",
        payload: vercelGatewayKey,
      });
  };

  const handleClearVercelGatewayKey = () => {
    if (vscode) vscode.postMessage({ type: "clearVercelGatewayKey" });
  };

  const handleSyncMessageCallback = useCallback(
    (handler: (message: any) => void) => {
      setSyncMessageHandler(() => handler);
    },
    [],
  );

  // // Update current prompt when cursor position or prompts change
  // useEffect(() => {
  //   const targetFile = isPinned ? pinnedFile : activeFile;
  //   const cursorOffset = targetFile?.cursor?.offset;
  //   const foundPrompt = findPromptAtCursor(prompts, cursorOffset);
  //   // setCurrentPrompt(foundPrompt);
  // }, [prompts, activeFile, pinnedFile, isPinned]);

  const targetFile = pinnedFile || activeFile;
  const [promptIdx, prompt] = useMemo(
    () => findPromptAtCursor(prompts, targetFile?.cursor?.offset),
    [targetFile?.cursor?.offset],
  );

  return (
    <div className="flex flex-col gap-2">
      <VercelGatewayPanel
        vercelGatewayKey={vercelGatewayKey}
        onVercelGatewayKeyChange={handleVercelGatewayKeyChange}
        onClearVercelGatewayKey={handleClearVercelGatewayKey}
        openSignal={vercelPanelOpenSignal}
      />

      <FileHeader
        prompts={prompts}
        promptIdx={promptIdx}
        fileState={fileState}
        pinnedFile={pinnedFile}
        activeFile={activeFile}
        isPinned={isPinned}
        parseStatus={parseStatus}
        parseError={parseError}
        onPin={handlePin}
        onUnpin={handleUnpin}
      />

      {targetFile && prompt && (
        <Blueprint
          file={targetFile}
          vscode={vscode}
          prompt={prompt}
          vercelGatewayKey={vercelGatewayKey}
        />
      )}

      <DebugSection
        vscode={vscode}
        settings={settings}
        prompts={prompts}
        fileState={fileState}
        activeFile={activeFile}
        onSyncMessage={handleSyncMessageCallback}
      />
    </div>
  );
}

function findPromptAtCursor(
  prompts: Prompt[],
  cursorOffset: number | undefined,
): [number, Prompt] | [] {
  if (!cursorOffset) return [];

  for (let idx = 0; idx < prompts.length; idx++) {
    const prompt = prompts[idx];
    if (
      prompt &&
      cursorOffset >= prompt.span.outer.start &&
      cursorOffset <= prompt.span.outer.end
    ) {
      return [idx, prompt];
    }
  }
  return [];
}
