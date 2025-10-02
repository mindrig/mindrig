import { useVsc } from "@/aspects/vsc/Context";
import type { SyncResource } from "@wrkspc/vsc-sync";
import {
  applyCodeChanges,
  computeTextChanges,
  VscMessageSync,
} from "@wrkspc/vsc-sync";
import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";

export namespace UseCodeSync {
  export interface Props {
    debounceMs?: number;
    resource?: SyncResource;
  }

  export interface Result {
    content: string;
    isConnected: boolean;
    ydoc: Y.Doc | null;
    ytext: Y.Text | null;
    updateContent: (
      content: string,
      selectionStart?: number,
      selectionEnd?: number,
    ) => void;
    handleSyncMessage: (message: any) => void;
  }
}

export function useCodeSync(props: UseCodeSync.Props): UseCodeSync.Result {
  const { vsc } = useVsc();
  const { debounceMs = 100, resource } = props;
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
      if (isApplyingRemoteRef.current) return;

      console.log(
        "Webview sending sync update to extension",
        JSON.stringify({ updateSize: update.length }),
      );
      const message: VscMessageSync.Update = {
        type: "sync-update",
        resource: resource ?? { type: "code", path: "" },
        payload: { update: Array.from(update) },
      };
      vsc.postMessage(message);
    };

    doc.on("update", updateHandler);

    // Request initial sync from extension
    const message: VscMessageSync.Init = {
      type: "sync-init",
      resource: resource ?? { type: "code", path: "" },
    };
    vsc.postMessage(message);

    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

      text.unobserve(observer);
      doc.off("update", updateHandler);
      doc.destroy();
    };
  }, [vsc, debounceMs, resource]);

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
            }),
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
    [debounceMs],
  );

  const handleSyncMessage = useCallback(
    (message: VscMessageSync) => {
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
            const stateVector = new Uint8Array(message.payload.stateVector);
            const update = Y.encodeStateAsUpdate(docRef.current, stateVector);

            const responseMessage: VscMessageSync.StateVector = {
              type: "sync-state-vector",
              resource: resource ?? { type: "code", path: "" },
              payload: { stateVector: Array.from(update) },
            };
            vsc.postMessage(responseMessage);
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
    [vsc, resource],
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
