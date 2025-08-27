import { useEffect, useState } from "react";

export namespace SecretPanel {
  export interface Props {
    secret: string | null;
    onSecretChange: (secret: string) => void;
    onClearSecret: () => void;
  }
}

export function SecretPanel(props: SecretPanel.Props) {
  const { secret, onSecretChange, onClearSecret } = props;
  const [inputValue, setInputValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setInputValue(secret || "");
  }, [secret]);

  const handleSave = () => {
    if (inputValue.trim()) {
      onSecretChange(inputValue.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setInputValue(secret || "");
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    else if (e.key === "Escape") handleCancel();
  };

  if (!secret && !isEditing)
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-yellow-800 mb-1">
              Secret Required
            </h3>
            <p className="text-sm text-yellow-700">
              Please enter your example secret to continue.
            </p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors duration-200"
          >
            Enter Secret
          </button>
        </div>
      </div>
    );

  if (isEditing)
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-gray-800 mb-3">Enter Secret</h3>
        <div className="space-y-3">
          <input
            type="password"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your secret..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={!inputValue.trim()}
              className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-green-800 mb-1">Secret Stored</h3>
          <p className="text-sm text-green-700">
            Secret: {"*".repeat(Math.min(secret?.length || 0, 8))}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            Update
          </button>
          <button
            onClick={onClearSecret}
            className="px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors duration-200"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
