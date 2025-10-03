import { useCallback, useEffect, useState } from "react";

export namespace AuthVercel {
  export interface Props {
    maskedKey: string | null;
    hasKey: boolean;
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
    readOnly,
    isSaving,
    errorMessage = null,
    onSave,
    onClear,
    openSignal = 0,
    onOpenChange,
  } = props;
  const [inputValue, setInputValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(!hasKey);

  const updateExpanded = useCallback(
    (next: boolean) => {
      setIsExpanded(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (!hasKey) {
      updateExpanded(true);
      setIsEditing(true);
      setInputValue("");
    }
  }, [hasKey, updateExpanded]);

  useEffect(() => {
    if (hasKey && !readOnly) {
      updateExpanded(true);
      setIsEditing(true);
    }
  }, [hasKey, readOnly, updateExpanded]);

  // Open on explicit signal from extension commands
  useEffect(() => {
    if (openSignal > 0) {
      updateExpanded(true);
      if (!readOnly) setIsEditing(true);
    }
  }, [openSignal, readOnly, updateExpanded]);

  useEffect(() => {
    if (errorMessage) {
      updateExpanded(true);
      setIsEditing(true);
    }
  }, [errorMessage, updateExpanded]);

  useEffect(() => {
    if (hasKey && !isSaving && !errorMessage) {
      updateExpanded(false);
      setIsEditing(false);
      setInputValue("");
    }
  }, [errorMessage, hasKey, isSaving, updateExpanded]);

  const canEdit = isEditing || !readOnly;

  const handleSave = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onSave(trimmed);
    if (!hasKey) updateExpanded(false);
    setInputValue("");
  };

  const handleClear = () => {
    onClear();
    setInputValue("");
    updateExpanded(false);
    setIsEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    else if (e.key === "Escape") updateExpanded(false);
  };

  const handleUpdate = () => {
    updateExpanded(true);
    setIsEditing(true);
    setInputValue("");
  };

  const disableInputs = isSaving || (!canEdit && hasKey);
  const resolvedMasked = maskedKey ?? "No key configured";

  const showForm = isExpanded || !hasKey;

  return (
    <div className="space-y-3">
      {!showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Vercel Gateway API Key</p>
            <p className="font-mono text-gray-900">{resolvedMasked}</p>
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
              onClick={() => {
                updateExpanded(false);
                setIsEditing(false);
              }}
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
              onChange={(e) => setInputValue(e.target.value)}
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
