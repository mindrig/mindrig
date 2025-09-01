import { useCodeSync } from "@/hooks/useCodeSync";
import { useEffect, useRef, useState } from "react";

export namespace CodeEditor {
  export interface Props {
    vscode: {
      postMessage: (message: any) => void;
      getState: () => any;
      setState: (state: any) => void;
    } | null;
    onSyncMessage?: (message: any) => void;
  }
}

export function CodeEditor({ vscode, onSyncMessage }: CodeEditor.Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isProgrammaticUpdateRef = useRef(false);
  const isUpdatingDOMRef = useRef(false);
  const { content, isConnected, updateContent, handleSyncMessage } =
    useCodeSync({
      vscode,
      debounceMs: 50, // Reduced for better responsiveness
    });
  const [characterCount, setCharacterCount] = useState(content.length);

  // Handle sync messages from parent
  useEffect(() => {
    if (onSyncMessage) onSyncMessage(handleSyncMessage);
  }, [handleSyncMessage, onSyncMessage]);

  const handleCodeChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Skip if this is a programmatic update to prevent feedback loop
    if (isProgrammaticUpdateRef.current || isUpdatingDOMRef.current) return;

    const newContent = event.target.value;
    const selectionStart = event.target.selectionStart;
    const selectionEnd = event.target.selectionEnd;

    setCharacterCount(newContent.length);
    updateContent(newContent, selectionStart, selectionEnd);
  };

  const handleKeyDown = (event: React.KeyEvent<HTMLTextAreaElement>) => {
    // Handle tab indentation
    if (event.key === "Tab") {
      event.preventDefault();
      const textarea = event.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newValue =
        textarea.value.substring(0, start) +
        "  " +
        textarea.value.substring(end);

      // Set flag to prevent onChange feedback
      isProgrammaticUpdateRef.current = true;
      textarea.value = newValue;
      textarea.setSelectionRange(start + 2, start + 2);
      isProgrammaticUpdateRef.current = false;

      updateContent(newValue, start + 2, start + 2);
    }
  };

  // Handle remote content updates (from VS Code) without losing focus
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || isUpdatingDOMRef.current) return;

    // Only update if the content is actually different from DOM
    if (textarea.value !== content) {
      const selectionStart = textarea.selectionStart;
      const selectionEnd = textarea.selectionEnd;
      const hasFocus = document.activeElement === textarea;

      // Set both flags to prevent feedback loops
      isUpdatingDOMRef.current = true;
      isProgrammaticUpdateRef.current = true;

      // Update DOM directly
      textarea.value = content;

      // Update character count
      setCharacterCount(content.length);

      // Restore cursor position if it's still valid
      if (selectionStart <= content.length && selectionEnd <= content.length)
        textarea.setSelectionRange(selectionStart, selectionEnd);

      // Restore focus if textarea had it before update
      if (hasFocus) textarea.focus();

      // Clear flags after a small delay to ensure DOM is updated
      setTimeout(() => {
        isProgrammaticUpdateRef.current = false;
        isUpdatingDOMRef.current = false;
      }, 0);
    }
  }, [content]);

  return (
    <div className="bg-white rounded-lg border border-gray-100">
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <h3 className="font-medium text-gray-800">Code Editor</h3>
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-400 animate-pulse" : "bg-gray-400"
            }`}
          />
          <span className="text-sm text-gray-600">
            {isConnected ? "Synced" : "Disconnected"}
          </span>
        </div>
      </div>

      <div className="p-3">
        <textarea
          ref={textareaRef}
          className="text-xs border border-gray-300 bg-gray-50 p-3 rounded max-h-64 overflow-y-auto w-full h-64 p-3 font-mono text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Start typing to sync with VS Code..."
          defaultValue={content}
          onChange={handleCodeChange}
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className="px-3 pb-3">
        <div className="text-xs text-gray-500">
          Content length: {characterCount} characters
        </div>
      </div>
    </div>
  );
}
