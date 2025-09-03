import { useEffect, useMemo, useState } from "react";
import { createGateway } from "@ai-sdk/gateway";

export namespace ModelPicker {
  export interface Props {
    vercelGatewayKey: string | null;
    selectedModelId: string | null;
    onModelChange: (modelId: string) => void;
  }
}

interface GatewayModelEntry {
  id: string;
  name?: string;
  description?: string | null;
  specification?: { provider?: string; modelId?: string };
  modelType?: "language" | "embedding" | "image" | null;
}

export function ModelPicker(props: ModelPicker.Props) {
  const { vercelGatewayKey, selectedModelId, onModelChange } = props;

  const [models, setModels] = useState<GatewayModelEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const languageModels = useMemo(
    () => models.filter((m) => (m.modelType ?? "language") === "language"),
    [models],
  );

  const fetchModels = async () => {
    if (!vercelGatewayKey) return;
    setIsLoading(true);
    setError(null);
    try {
      const gateway = createGateway({ apiKey: vercelGatewayKey });
      const res = await gateway.getAvailableModels();
      setModels(res.models || []);
      if (!selectedModelId && (res.models?.length || 0) > 0) {
        const first = (res.models || []).find(
          (m: any) => (m.modelType ?? "language") === "language",
        );
        if (first) onModelChange(first.id);
      }
    } catch (e) {
      console.error("Failed to load models", JSON.stringify({ error: String(e) }));
      setError(
        e instanceof Error ? e.message : "Failed to load models from Gateway",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!vercelGatewayKey) return;
    // Fetch once on key availability
    fetchModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vercelGatewayKey]);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Model</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchModels}
            disabled={!vercelGatewayKey || isLoading}
            className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            title={vercelGatewayKey ? "Refresh models" : "Set API key first"}
          >
            {isLoading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>
      <div className="p-4 space-y-2">
        {!vercelGatewayKey && (
          <p className="text-xs text-gray-600">
            Set your Vercel Gateway API key to load models.
          </p>
        )}
        {error && (
          <p className="text-xs text-red-600">Error: {error}</p>
        )}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Select Model
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            value={selectedModelId ?? ""}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={!vercelGatewayKey || isLoading || languageModels.length === 0}
          >
            <option value="" disabled>
              {isLoading ? "Loading…" : "Choose a model"}
            </option>
            {languageModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || m.id}
              </option>
            ))}
          </select>
        </div>
        {selectedModelId && (
          <div className="text-xs text-gray-600">
            <span className="font-mono">{selectedModelId}</span>
          </div>
        )}
      </div>
    </div>
  );
}

