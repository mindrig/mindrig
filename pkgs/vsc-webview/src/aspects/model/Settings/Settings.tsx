import type { AttachmentInput } from "@wrkspc/model";
import { useMemo } from "react";

import type {
  ModelCapabilities,
  ModelConfig,
  ModelConfigErrors,
} from "../Setups";

export interface ModelSettingsProps {
  // TODO:
  // field: Field<ModelSettings>;
  config: ModelConfig;
  errors: ModelConfigErrors;
  caps: ModelCapabilities;
  attachments: AttachmentInput[];
  onRequestAttachments: () => void;
  onClearAttachments: () => void;
  onGenerationOptionChange: (
    field:
      | "maxOutputTokens"
      | "temperature"
      | "topP"
      | "topK"
      | "presencePenalty"
      | "frequencyPenalty"
      | "stopSequences"
      | "seed",
    value: number | string | undefined,
  ) => void;
  onReasoningChange: (updates: Partial<ModelConfig["reasoning"]>) => void;
  onToolsJsonChange: (value: string) => void;
  onProviderOptionsJsonChange: (value: string) => void;
}

export { ModelSettingsComponent as ModelSettings };

function ModelSettingsComponent(props: ModelSettingsProps) {
  const {
    config,
    errors,
    caps,
    attachments,
    onRequestAttachments,
    onClearAttachments,
    onGenerationOptionChange,
    onReasoningChange,
    onToolsJsonChange,
    onProviderOptionsJsonChange,
  } = props;

  const canAttach = caps.supportsFiles || caps.supportsImages;
  const attachmentLabel = useMemo(() => {
    if (!canAttach) return null;
    return caps.supportsFiles ? "Attach Files" : "Attach Images";
  }, [canAttach, caps.supportsFiles]);

  // TODO: Rather than add attachments here, move the code to pkgs/vsc-webview/src/aspects/prompt/Attachments.tsx
  // and render it in the prompt area.
  return (
    <div className="space-y-4 border rounded p-3">
      {(canAttach || attachments.length > 0) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {canAttach && (
                <button
                  type="button"
                  onClick={onRequestAttachments}
                  className="inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded whitespace-nowrap"
                >
                  {attachmentLabel}
                </button>
              )}

              {attachments.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAttachments}
                  className="inline-flex items-center px-2.5 py-1.5 border text-xs font-medium rounded whitespace-nowrap"
                >
                  Clear
                </button>
              )}
            </div>

            {attachments.length > 0 && (
              <span className="text-xs">
                {attachments.length} attachment
                {attachments.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {attachments.length > 0 && (
            <div className="space-y-2 text-xs">
              {attachments.map((attachment) => {
                const key = attachment.path || attachment.name;
                const approximateSize =
                  typeof attachment.dataBase64 === "string"
                    ? Math.round((attachment.dataBase64.length * 3) / 4 / 1024)
                    : null;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="font-medium">{attachment.name}</span>
                    {approximateSize !== null && (
                      <span className="text-neutral-500">
                        {approximateSize} KB
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs">
          Max output tokens
          <input
            type="number"
            className="mt-1 w-full px-2 py-1 border rounded text-xs"
            value={config.generationOptions.maxOutputTokens ?? ""}
            onChange={(event) =>
              onGenerationOptionChange(
                "maxOutputTokens",
                event.target.value === ""
                  ? undefined
                  : Number(event.target.value),
              )
            }
            min={1}
          />
        </label>
        <label className="text-xs">
          Temperature
          <input
            type="number"
            className="mt-1 w-full px-2 py-1 border rounded text-xs"
            value={config.generationOptions.temperature ?? ""}
            onChange={(event) =>
              onGenerationOptionChange(
                "temperature",
                event.target.value === ""
                  ? undefined
                  : Number(event.target.value),
              )
            }
            step={0.1}
            min={0}
            max={2}
          />
        </label>
        <label className="text-xs">
          Top P
          <input
            type="number"
            className="mt-1 w-full px-2 py-1 border rounded text-xs"
            value={config.generationOptions.topP ?? ""}
            onChange={(event) =>
              onGenerationOptionChange(
                "topP",
                event.target.value === ""
                  ? undefined
                  : Number(event.target.value),
              )
            }
            step={0.01}
            min={0}
            max={1}
          />
        </label>
        <label className="text-xs">
          Top K
          <input
            type="number"
            className="mt-1 w-full px-2 py-1 border rounded text-xs"
            value={config.generationOptions.topK ?? ""}
            onChange={(event) =>
              onGenerationOptionChange(
                "topK",
                event.target.value === ""
                  ? undefined
                  : Number(event.target.value),
              )
            }
            min={0}
          />
        </label>
        <label className="text-xs">
          Presence penalty
          <input
            type="number"
            className="mt-1 w-full px-2 py-1 border rounded text-xs"
            value={config.generationOptions.presencePenalty ?? ""}
            onChange={(event) =>
              onGenerationOptionChange(
                "presencePenalty",
                event.target.value === ""
                  ? undefined
                  : Number(event.target.value),
              )
            }
            step={0.1}
            min={-2}
            max={2}
          />
        </label>
        <label className="text-xs">
          Frequency penalty
          <input
            type="number"
            className="mt-1 w-full px-2 py-1 border rounded text-xs"
            value={config.generationOptions.frequencyPenalty ?? ""}
            onChange={(event) =>
              onGenerationOptionChange(
                "frequencyPenalty",
                event.target.value === ""
                  ? undefined
                  : Number(event.target.value),
              )
            }
            step={0.1}
            min={-2}
            max={2}
          />
        </label>
        <label className="text-xs">
          Stop sequences
          <input
            type="text"
            className="mt-1 w-full px-2 py-1 border rounded text-xs"
            value={config.generationOptions.stopSequences ?? ""}
            onChange={(event) =>
              onGenerationOptionChange("stopSequences", event.target.value)
            }
            placeholder="comma,separated"
          />
        </label>
        <label className="text-xs">
          Seed
          <input
            type="number"
            className="mt-1 w-full px-2 py-1 border rounded text-xs"
            value={config.generationOptions.seed ?? ""}
            onChange={(event) =>
              onGenerationOptionChange(
                "seed",
                event.target.value === ""
                  ? undefined
                  : Number(event.target.value),
              )
            }
          />
        </label>
      </div>

      <div className="space-y-2">
        <label className="inline-flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={caps.supportsReasoning && config.reasoning.enabled}
            onChange={(event) =>
              onReasoningChange({
                enabled: caps.supportsReasoning && event.target.checked,
              })
            }
            disabled={!caps.supportsReasoning}
          />
          Enable reasoning
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs">
            Reasoning effort
            <select
              className="mt-1 w-full px-2 py-1 border rounded text-xs"
              value={config.reasoning.effort}
              onChange={(event) =>
                onReasoningChange({
                  effort: event.target
                    .value as ModelConfig["reasoning"]["effort"],
                })
              }
              disabled={!caps.supportsReasoning || !config.reasoning.enabled}
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>

          <label className="text-xs">
            Budget tokens (optional)
            <input
              type="number"
              className="mt-1 w-full px-2 py-1 border rounded text-xs"
              value={config.reasoning.budgetTokens}
              onChange={(event) =>
                onReasoningChange({
                  budgetTokens:
                    event.target.value === "" ? "" : Number(event.target.value),
                })
              }
              disabled={!caps.supportsReasoning || !config.reasoning.enabled}
              min={0}
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs">
          Tools (JSON)
          <textarea
            className="mt-1 w-full px-2 py-1 border rounded text-xs font-mono"
            rows={3}
            value={config.toolsJson}
            onChange={(event) => onToolsJsonChange(event.target.value)}
            placeholder="null"
          />
          {errors.tools && <span className="text-xs">{errors.tools}</span>}
        </label>

        <label className="text-xs">
          Provider Options (JSON)
          <textarea
            className="mt-1 w-full px-2 py-1 border rounded text-xs font-mono"
            rows={3}
            value={config.providerOptionsJson}
            onChange={(event) =>
              onProviderOptionsJsonChange(event.target.value)
            }
            placeholder="{}"
          />
          {errors.providerOptions && (
            <span className="text-xs">{errors.providerOptions}</span>
          )}
        </label>
      </div>
    </div>
  );
}
