import { useVsc } from "@/aspects/vsc/Context";
import { Prompt } from "@mindcontrol/code-types";
import { SyncFile } from "@mindcontrol/vscode-sync";
import { findPromptAtCursor } from "@wrkspc/prompt";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthVercel } from "../aspects/auth/Vercel";
import { Blueprint } from "../aspects/blueprint/Blueprint";
import { DevDebug } from "../aspects/dev/DebugSection";
import { FileHeader } from "../aspects/file/Header";
import { Layout } from "./Layout";

export function Index() {
  const [fileState, setFileState] = useState<SyncFile.State | null>(null);
  const [pinnedFile, setPinnedFile] = useState<SyncFile.State | null>(null);
  const [activeFile, setActiveFile] = useState<SyncFile.State | null>(null);
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [vercelGatewayKey, setVercelGatewayKey] = useState<
    string | null | undefined
  >(undefined);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [parseStatus, setParseStatus] = useState<"success" | "error">(
    "success",
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const { vsc } = useVsc();
  const [syncMessageHandler, setSyncMessageHandler] = useState<
    ((message: any) => void) | null
  >(null);
  const [vercelPanelOpenSignal, setVercelPanelOpenSignal] = useState(0);

  useEffect(() => {
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

    vsc.postMessage({ type: "webviewReady" });

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [vsc, syncMessageHandler]);

  const handlePin = () => {
    if (vsc) vsc.postMessage({ type: "pinFile" });
  };

  const handleUnpin = () => {
    vsc.postMessage({ type: "unpinFile" });
  };

  const handleVercelGatewayKeyChange = (vercelGatewayKey: string) => {
    vsc.postMessage({
      type: "setVercelGatewayKey",
      payload: vercelGatewayKey,
    });
  };

  const handleClearVercelGatewayKey = () => {
    vsc.postMessage({ type: "clearVercelGatewayKey" });
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
  const [promptIdx, prompt] = useMemo(() => {
    return findPromptAtCursor(prompts, targetFile?.cursor?.offset);
  }, [targetFile?.cursor?.offset, prompts]);

  return (
    <Layout>
      <div className="flex flex-col gap-2">
        <AuthVercel
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
            prompt={prompt}
            vercelGatewayKey={vercelGatewayKey}
            promptIndex={promptIdx ?? null}
          />
        )}

        <DevDebug
          prompts={prompts}
          fileState={fileState}
          activeFile={activeFile}
          onSyncMessage={handleSyncMessageCallback}
        />
      </div>
    </Layout>
  );
}

// moved to @wrkspc/prompt
