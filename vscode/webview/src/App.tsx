import {
  ActiveFile,
  VercelGatewayPanel,
  DebugSection,
} from "@/components";
import { useCallback, useEffect, useState } from "react";

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
  const [fileState, setFileState] = useState<any>(null);
  const [pinnedFile, setPinnedFile] = useState<any>(null);
  const [activeFile, setActiveFile] = useState<any>(null);
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [settings, setSettings] = useState<any>(null);
  const [vercelGatewayKey, setVercelGatewayKey] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [vscode] = useState(() => window.acquireVsCodeApi?.());
  const [syncMessageHandler, setSyncMessageHandler] = useState<
    ((message: any) => void) | null
  >(null);

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
        case "promptsChanged":
          setPrompts(message.payload.prompts);
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
    if (vscode) vscode.postMessage({ type: "setVercelGatewayKey", payload: vercelGatewayKey });
  };

  const handleClearVercelGatewayKey = () => {
    if (vscode) vscode.postMessage({ type: "clearVercelGatewayKey" });
  };

  const handleSyncMessageCallback = useCallback(
    (handler: (message: any) => void) => {
      setSyncMessageHandler(() => handler);
    },
    []
  );

  return (
    <div className="h-full bg-gradient-to-br from-purple-50 to-blue-50 p-4 space-y-4 overflow-y-auto">
      <VercelGatewayPanel
        vercelGatewayKey={vercelGatewayKey}
        onVercelGatewayKeyChange={handleVercelGatewayKeyChange}
        onClearVercelGatewayKey={handleClearVercelGatewayKey}
      />

      <ActiveFile
        fileState={fileState}
        pinnedFile={pinnedFile}
        activeFile={activeFile}
        isPinned={isPinned}
        onPin={handlePin}
        onUnpin={handleUnpin}
      />

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
