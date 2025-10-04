import { Button } from "@wrkspc/ds";
import { providerLogoUrl } from "@wrkspc/model";

import type {
  ModelCapabilities,
  ModelConfig,
  ModelConfigErrors,
  ModelOption,
  ProviderOption,
} from "./Setups";
import { ModelSelector } from "./Selector";
import { ModelSettings } from "./Settings";

export interface ModelSetupProps {
  config: ModelConfig;
  providerOptions: ProviderOption[];
  modelOptions: ModelOption[];
  capabilities: ModelCapabilities;
  errors: ModelConfigErrors;
  isExpanded: boolean;
  canRemove: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
  onProviderChange: (providerId: string | null) => void;
  onModelChange: (modelId: string | null) => void;
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
  onReasoningChange: (
    updates: Partial<ModelConfig["reasoning"]>,
  ) => void;
  onToolsJsonChange: (value: string) => void;
  onProviderOptionsJsonChange: (value: string) => void;
  onRequestAttachments: () => void;
  onClearAttachments: () => void;
}

export function ModelSetup(props: ModelSetupProps) {
  const {
    config,
    providerOptions,
    modelOptions,
    capabilities,
    errors,
    isExpanded,
    canRemove,
    onToggleExpand,
    onRemove,
    onProviderChange,
    onModelChange,
    onGenerationOptionChange,
    onReasoningChange,
    onToolsJsonChange,
    onProviderOptionsJsonChange,
    onRequestAttachments,
    onClearAttachments,
  } = props;

  const logoUrl = capabilities.provider
    ? providerLogoUrl(capabilities.provider, { format: "svg" })
    : "";

  return (
    <div className="border rounded p-3 space-y-3">
      <ModelSelector
        providerOptions={providerOptions}
        modelOptions={modelOptions}
        providerId={config.providerId}
        modelId={config.modelId}
        providerError={errors.provider ?? null}
        modelError={errors.model ?? null}
        onProviderChange={onProviderChange}
        onModelChange={onModelChange}
      />

      <div className="flex flex-wrap items-center gap-3">
        {logoUrl && (
          <img src={logoUrl} alt={capabilities.provider} className="h-5 w-5" />
        )}

        <Button size="xsmall" style="transparent" onClick={onToggleExpand}>
          {isExpanded ? "Hide options" : "Configure"}
        </Button>

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-auto inline-flex items-center justify-center h-6 w-6 rounded-full border text-xs"
            title="Remove model"
          >
            ✕
          </button>
        )}
      </div>

      {config.modelId && (
        <div className="flex items-center gap-2 text-[10px] flex-wrap">
          {capabilities.supportsImages && (
            <span className="px-2 py-0.5 rounded border">Images</span>
          )}
          {capabilities.supportsVideo && (
            <span className="px-2 py-0.5 rounded border">Video</span>
          )}
          {capabilities.supportsFiles && (
            <span className="px-2 py-0.5 rounded border">Files</span>
          )}
          {capabilities.supportsTools && (
            <span className="px-2 py-0.5 rounded border">Tools</span>
          )}
          {capabilities.supportsReasoning && (
            <span className="px-2 py-0.5 rounded border">Reasoning</span>
          )}
        </div>
      )}

      {isExpanded && (
        <ModelSettings
          config={config}
          errors={errors}
          caps={capabilities}
          attachments={config.attachments}
          onRequestAttachments={onRequestAttachments}
          onClearAttachments={onClearAttachments}
          onGenerationOptionChange={onGenerationOptionChange}
          onReasoningChange={onReasoningChange}
          onToolsJsonChange={onToolsJsonChange}
          onProviderOptionsJsonChange={onProviderOptionsJsonChange}
        />
      )}
    </div>
  );
}
