import { Select } from "@wrkspc/ds";

export interface ProviderOption {
  id: string;
  label: string;
}

export interface ModelOption {
  id: string;
  label: string;
}

export interface ModelSelectorErrors {
  provider?: string | null;
  model?: string | null;
}

export interface ModelSelectorProps {
  providerOptions: ProviderOption[];
  modelOptions: ModelOption[];
  providerId: string | null;
  modelId: string | null;
  providerError?: string | null;
  modelError?: string | null;
  disabled?: boolean;
  onProviderChange: (providerId: string | null) => void;
  onModelChange: (modelId: string | null) => void;
}

export function ModelSelector(props: ModelSelectorProps) {
  const {
    providerOptions,
    modelOptions,
    providerId,
    modelId,
    providerError,
    modelError,
    disabled,
    onProviderChange,
    onModelChange,
  } = props;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Select
        label={{ a11y: "Select model provider" }}
        options={providerOptions.map((option) => ({
          label: option.label,
          value: option.id,
        }))}
        selectedKey={providerId ?? null}
        onSelectionChange={(value) => {
          if (value === null) {
            onProviderChange(null);
            return;
          }
          const next = typeof value === "string" ? value : String(value);
          onProviderChange(next === "" ? null : next);
        }}
        placeholder="Select provider..."
        size="small"
        errors={providerError}
        isDisabled={!!disabled}
      />

      <Select
        label={{ a11y: "Select model" }}
        options={modelOptions.map((option) => ({
          label: option.label,
          value: option.id,
        }))}
        selectedKey={modelId ?? null}
        onSelectionChange={(value) => {
          if (value === null) {
            onModelChange(null);
            return;
          }
          const next = typeof value === "string" ? value : String(value);
          onModelChange(next === "" ? null : next);
        }}
        isDisabled={Boolean(disabled || modelOptions.length === 0)}
        placeholder="Select model..."
        size="small"
        errors={modelError}
      />
    </div>
  );
}
