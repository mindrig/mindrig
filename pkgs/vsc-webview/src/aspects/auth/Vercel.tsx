import { useCallback, useEffect, useMemo, useState } from "react";

export namespace AuthVercel {
  export interface Props {
    maskedKey: string | null;
    hasKey: boolean;
    isResolved: boolean;
    readOnly: boolean;
    isSaving: boolean;
    errorMessage?: string | null;
    onSave: (key: string) => void;
    onClear: () => void;
    openSignal?: number;
    onOpenChange?: (open: boolean) => void;
  }
}

export function AuthVercel(props: AuthVercel.Props) {
  const {
    maskedKey,
    hasKey,
    isResolved,
    readOnly,
    isSaving,
    errorMessage = null,
    onSave,
    onClear,
    openSignal = 0,
    onOpenChange,
  } = props;

  const [inputValue, setInputValue] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingAutoHide, setPendingAutoHide] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);

  const resolvedVisible = isVisible && isResolved;
  const showForm = resolvedVisible && isEditing;
  const showSummary = resolvedVisible && hasKey && !isEditing;

  const notifyVisibility = useCallback(
    (open: boolean) => {
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  useEffect(() => {
    notifyVisibility(resolvedVisible);
  }, [resolvedVisible, notifyVisibility]);

  useEffect(() => {
    if (isResolved) return;
    setIsVisible(false);
    setIsEditing(false);
    setPendingAutoHide(false);
    setPendingOpen(false);
  }, [isResolved]);

  useEffect(() => {
    if (!isResolved) return;

    if (hasKey) {
      setIsEditing(false);
      if (pendingAutoHide && !isSaving && !errorMessage) {
        setIsVisible(false);
        setIsEditing(false);
        setPendingAutoHide(false);
      }
      return;
    }

    setIsEditing(true);
    if (pendingAutoHide) setPendingAutoHide(false);
    setInputValue("");
  }, [hasKey, isSaving, errorMessage, pendingAutoHide, isResolved]);

  useEffect(() => {
    if (!isResolved || !errorMessage) return;
    setIsVisible(true);
    setIsEditing(true);
  }, [errorMessage, isResolved]);

  const openPanel = useCallback(() => {
    if (!isResolved) return;
    setIsVisible(true);
    setIsEditing(!hasKey);
    setPendingAutoHide(false);
  }, [hasKey, isResolved]);

  useEffect(() => {
    if (openSignal === 0) return;
    if (!isResolved) {
      setPendingOpen(true);
      return;
    }
    openPanel();
    setPendingOpen(false);
  }, [openSignal, isResolved, openPanel]);

  useEffect(() => {
    if (!isResolved || !pendingOpen) return;
    openPanel();
    setPendingOpen(false);
  }, [isResolved, pendingOpen, openPanel]);

  const disableInputs = useMemo(() => {
    if (!isResolved) return true;
    if (pendingAutoHide && !isSaving && !errorMessage) return true;
    if (!hasKey) return isSaving;
    if (readOnly) return true;
    return isSaving;
  }, [hasKey, isSaving, readOnly, isResolved, pendingAutoHide, errorMessage]);

  const handleSave = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setInputValue("");
    setPendingAutoHide(true);
  };

  const handleClear = () => {
    onClear();
    setIsVisible(true);
    setIsEditing(true);
    setPendingAutoHide(false);
    setPendingOpen(false);
    setInputValue("");
  };

  const handleUpdate = () => {
    setIsEditing(true);
    setPendingAutoHide(false);
    setInputValue("");
  };

  const handleClose = () => {
    setIsVisible(false);
    setIsEditing(false);
    setPendingAutoHide(false);
    setPendingOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleClose();
  };

  if (!resolvedVisible) return null;

  return (
    <div className="space-y-3">
      {showSummary && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Vercel Gateway API Key</p>
            <p className="font-mono text-gray-900">{maskedKey ?? "••••"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpdate}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              disabled={isSaving}
            >
              Update
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-2 text-sm border border-red-600 text-red-600 rounded-lg hover:border-red-700 hover:text-red-700 transition-colors"
              disabled={isSaving}
            >
              Clear
            </button>
            <button
              onClick={handleClose}
              className="px-2 py-2 text-sm text-gray-500 hover:text-gray-700"
              disabled={isSaving}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">
              Vercel Gateway API Key
            </h3>
            <button
              onClick={handleClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Close"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your Vercel Gateway API key..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              disabled={disableInputs}
            />
            {errorMessage && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}
            <div className="flex justify-between items-center">
              <button
                onClick={handleSave}
                disabled={!inputValue.trim() || isSaving}
                className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-2 border border-red-600 text-red-600 text-sm rounded-lg hover:border-red-700 hover:text-red-700 transition-colors duration-200 bg-transparent"
                disabled={isSaving}
              >
                Clear
              </button>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <a
                href="https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%2Fapi-keys%3Futm_source%3Dmindcontrol_vscode&title=Get+an+API+Key"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                Get an API key
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
