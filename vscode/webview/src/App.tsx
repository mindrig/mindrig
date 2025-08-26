import "@/styles.css";
import { ActiveFile, SecretPanel, SettingsPanel } from "@/components";
import { useEffect, useState } from "react";

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
  const [secret, setSecret] = useState<string | null>(null);
  const [vscode] = useState(() => window.acquireVsCodeApi?.());

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
        case "secretChanged":
          setSecret(message.payload.secret);
          break;
      }
    };

    window.addEventListener("message", handleMessage);

    vscode.postMessage({ type: "webviewReady" });

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [vscode]);

  const handleAddItWorks = () => {
    if (vscode) vscode.postMessage({ type: "addItWorks" });
  };

  const handlePin = () => {
    if (vscode) vscode.postMessage({ type: "pinFile" });
  };

  const handleUnpin = () => {
    if (vscode) vscode.postMessage({ type: "unpinFile" });
  };

  const handleSecretChange = (secret: string) => {
    if (vscode) vscode.postMessage({ type: "setSecret", payload: secret });
  };

  const handleClearSecret = () => {
    if (vscode) vscode.postMessage({ type: "clearSecret" });
  };

  return (
    <div className="h-full bg-gradient-to-br from-purple-50 to-blue-50 p-4 space-y-4 overflow-y-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800 mb-1">
          Mind Control Code
        </h1>
        <p className="text-gray-600 text-sm">File tracking and controls</p>
      </div>

      <SecretPanel
        secret={secret}
        onSecretChange={handleSecretChange}
        onClearSecret={handleClearSecret}
      />

      <ActiveFile
        fileState={fileState}
        pinnedFile={pinnedFile}
        activeFile={activeFile}
        isPinned={isPinned}
        showContent={settings?.showFileContent !== false}
        onPin={handlePin}
        onUnpin={handleUnpin}
      />

      <div className="space-y-3">
        <button
          onClick={handleAddItWorks}
          className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!fileState}
        >
          Add "It works!" Comment
        </button>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-2">Status</h3>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${fileState ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}
            ></div>
            <span className="text-sm text-gray-600">
              {fileState
                ? `Tracking ${fileState.language} file`
                : "No supported file open"}
            </span>
          </div>
        </div>
      </div>

      <SettingsPanel settings={settings} />
    </div>
  );
}
