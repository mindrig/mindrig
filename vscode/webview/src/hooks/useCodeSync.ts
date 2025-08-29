import {
  applyCodeChanges,
  computeTextChanges,
  SyncMessage,
} from "@mindcontrol/vscode-sync";
import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";

export namespace UseCodeSync {
  export interface Props {
    vscode: {
      postMessage: (message: any) => void;
      getState: () => any;
      setState: (state: any) => void;
    } | null;
    debounceMs?: number;
  }

  export interface Result {
    content: string;
    isConnected: boolean;
    ydoc: Y.Doc | null;
    ytext: Y.Text | null;
    updateContent: (
      content: string,
      selectionStart?: number,
      selectionEnd?: number
    ) => void;
    handleSyncMessage: (message: any) => void;
  }
}

export function useCodeSync(props: UseCodeSync.Props): UseCodeSync.Result {
  const { vscode, debounceMs = 100 } = props;
  const [content, setContent] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const docRef = useRef<Y.Doc | null>(null);
  const textRef = useRef<Y.Text | null>(null);
  const isApplyingRemoteRef = useRef(false);
  const isApplyingLocalUIRef = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastKnownContentRef = useRef<string>("");

  // Initialize Yjs document
  useEffect(() => {
    const doc = new Y.Doc();
    const text = doc.getText("content");

    docRef.current = doc;
    textRef.current = doc.getText("content");

    // Set up observer for local changes
    const observer = (event: Y.YTextEvent) => {
      // Skip if we're applying remote changes OR local UI changes
      if (isApplyingRemoteRef.current || isApplyingLocalUIRef.current) return;

      const newContent = text.toString();
      lastKnownContentRef.current = newContent;
      setContent(newContent);
    };

    text.observe(observer);

    // Set up update handler for remote sync
    const updateHandler = (update: Uint8Array) => {
      if (!vscode || isApplyingRemoteRef.current) return;

      console.log(
        "Webview sending sync update to extension",
        JSON.stringify({ updateSize: update.length })
      );
      const message: SyncMessage.Update = {
        type: "sync-update",
        payload: { update: Array.from(update) },
      };
      vscode.postMessage(message);
    };

    doc.on("update", updateHandler);

    // Request initial sync from extension
    if (vscode) {
      const message: SyncMessage.Init = { type: "sync-init" };
      vscode.postMessage(message);
    }

    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

      text.unobserve(observer);
      doc.off("update", updateHandler);
      doc.destroy();
    };
  }, [vscode, debounceMs]);

  const updateContent = useCallback(
    (newContent: string, _selectionStart?: number, _selectionEnd?: number) => {
      if (!textRef.current || isApplyingRemoteRef.current) return;

      const ytext = textRef.current;
      const currentContent = lastKnownContentRef.current;

      if (newContent === currentContent) return;

      // Update immediately to prevent stale comparisons
      lastKnownContentRef.current = newContent;

      // Clear any pending debounced updates
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

      // Debounce rapid changes
      debounceTimeoutRef.current = setTimeout(() => {
        try {
          // Set flag to prevent observer from triggering React state update
          isApplyingLocalUIRef.current = true;

          const changes = computeTextChanges(currentContent, newContent);
          console.log(
            "Webview applying text changes:",
            JSON.stringify({
              changes,
              currentLength: currentContent.length,
              newLength: newContent.length,
            })
          );

          // Apply changes using YjsHelpers
          applyCodeChanges(ytext, changes);

          // Update our internal tracking but don't trigger React re-render
          // The textarea already has the correct value from user input
          lastKnownContentRef.current = newContent;
        } catch (error) {
          console.error("Failed to update Yjs content:", error);
          // Fallback: reset to current content
          if (textRef.current) {
            const fallbackContent = textRef.current.toString();
            lastKnownContentRef.current = fallbackContent;
            setContent(fallbackContent);
          }
        } finally {
          isApplyingLocalUIRef.current = false;
        }
      }, debounceMs);
    },
    [debounceMs]
  );

  const handleSyncMessage = useCallback(
    (message: SyncMessage) => {
      if (!docRef.current || !textRef.current) return;

      try {
        switch (message.type) {
          case "sync-update": {
            const update = new Uint8Array(message.payload.update);
            isApplyingRemoteRef.current = true;

            try {
              Y.applyUpdate(docRef.current, update);
              const newContent = textRef.current.toString();
              lastKnownContentRef.current = newContent;
              setContent(newContent);
              setIsConnected(true);
            } catch (error) {
              console.error("Failed to apply sync update:", error);
              setIsConnected(false);
            } finally {
              isApplyingRemoteRef.current = false;
            }
            break;
          }

          case "sync-state-vector": {
            if (!vscode) return;

            const stateVector = new Uint8Array(message.payload.stateVector);
            const update = Y.encodeStateAsUpdate(docRef.current, stateVector);

            const responseMessage: SyncMessage.StateVector = {
              type: "sync-state-vector",
              payload: { stateVector: Array.from(update) },
            };
            vscode.postMessage(responseMessage);
            break;
          }

          default:
            console.warn("Unknown sync message type:", message.type);
        }
      } catch (error) {
        console.error("Error handling sync message:", error, message);
        setIsConnected(false);
      }
    },
    [vscode]
  );

  return {
    content,
    isConnected,
    ydoc: docRef.current,
    ytext: textRef.current,
    updateContent,
    handleSyncMessage,
  };
}
