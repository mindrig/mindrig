import { useEffect, useState } from "react";

export namespace AuthVercel {
  export interface Props {
    vercelGatewayKey: string | null;
    onVercelGatewayKeyChange: (key: string) => void;
    onClearVercelGatewayKey: () => void;
    openSignal?: number;
  }
}

export function AuthVercel(props: AuthVercel.Props) {
  const {
    vercelGatewayKey,
    onVercelGatewayKeyChange,
    onClearVercelGatewayKey,
    openSignal = 0,
  } = props;
  const [inputValue, setInputValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    setInputValue(vercelGatewayKey || "");
    setHasKey(!!vercelGatewayKey);
  }, [vercelGatewayKey]);

  // Open on explicit signal from extension commands
  useEffect(() => {
    if (openSignal > 0) setIsExpanded(true);
  }, [openSignal]);

  const handleSave = () => {
    if (inputValue.trim()) {
      setHasKey(true);
      onVercelGatewayKeyChange(inputValue.trim());
      setIsExpanded(false);
    }
  };

  const handleClear = () => {
    setHasKey(false);
    onClearVercelGatewayKey();
    setInputValue("");
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    else if (e.key === "Escape") setIsExpanded(false);
  };

  return (
    <div className="space-y-3">
      {/* API Key Form (no topbar) */}
      {isExpanded && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">
              Vercel Gateway API Key
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
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
            />
            <div className="flex justify-between items-center">
              <button
                onClick={handleSave}
                disabled={!inputValue.trim()}
                className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-2 border border-red-600 text-red-600 text-sm rounded-lg hover:border-red-700 hover:text-red-700 transition-colors duration-200 bg-transparent"
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
