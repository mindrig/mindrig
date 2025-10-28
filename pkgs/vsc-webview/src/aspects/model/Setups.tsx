import { useModels } from "@/aspects/model/Context";

// export interface ModelCapabilities {
//   supportsImages: boolean;
//   supportsVideo: boolean;
//   supportsFiles: boolean;
//   supportsTools: boolean;
//   supportsReasoning: boolean;
//   provider: string;
// }

// export interface ModelConfig {
//   key: string;
//   providerId: string | null;
//   modelId: string | null;
//   label?: string | null;
//   generationOptions: GenerationOptionsInput;
//   reasoning: {
//     enabled: boolean;
//     effort: "low" | "medium" | "high";
//     budgetTokens: number | "";
//   };
//   toolsJson: string;
//   providerOptionsJson: string;
//   attachments: AttachmentInput[];
// }

// export interface ModelConfigErrors {
//   provider?: string | null;
//   model?: string | null;
//   tools?: string | null;
//   providerOptions?: string | null;
// }

// export interface ProviderOption {
//   id: string;
//   label: string;
// }

// export interface ModelOption {
//   id: string;
//   label: string;
// }

// export interface UseModelSetupsStateOptions {
//   models: AvailableModel[];
//   providerOptions: ProviderOption[];
//   groupedModelsByProvider: Record<string, ModelOption[]>;
//   normaliseProviderId: (value: string | undefined | null) => string;
// }

// export interface ModelSetupsState {
//   configs: ModelConfig[];
//   errors: Record<string, ModelConfigErrors>;
//   expandedKey: string | null;
//   setExpandedKey: Dispatch<SetStateAction<string | null>>;
//   addConfig: (preferredModelId?: string | null) => ModelConfig;
//   removeConfig: (key: string) => void;
//   replaceAllConfigs: (configs: ModelConfig[]) => void;
//   replaceAllErrors: (errors: Record<string, ModelConfigErrors>) => void;
//   updateConfig: (
//     key: string,
//     updater: (config: ModelConfig) => ModelConfig,
//   ) => void;
//   updateErrors: (key: string, updates: Partial<ModelConfigErrors>) => void;
//   handleProviderChange: (key: string, providerId: string | null) => void;
//   handleModelChange: (key: string, modelId: string | null) => void;
//   updateGenerationOption: (
//     key: string,
//     field:
//       | "maxOutputTokens"
//       | "temperature"
//       | "topP"
//       | "topK"
//       | "presencePenalty"
//       | "frequencyPenalty"
//       | "stopSequences"
//       | "seed",
//     value: number | string | undefined,
//   ) => void;
//   updateReasoning: (
//     key: string,
//     updates: Partial<ModelConfig["reasoning"]>,
//   ) => void;
//   updateToolsJson: (key: string, value: string) => void;
//   updateProviderOptionsJson: (key: string, value: string) => void;
// }

// function createModelConfigKey(): string {
//   if (typeof crypto !== "undefined" && "randomUUID" in crypto)
//     return `model-${crypto.randomUUID()}`;
//   return `model-${Math.random().toString(36).slice(2)}`;
// }

// function createInitialConfig(
//   models: AvailableModel[],
//   providerOptions: ProviderOption[],
//   normaliseProviderId: UseModelSetupsStateOptions["normaliseProviderId"],
//   groupedModelsByProvider: Record<string, ModelOption[]>,
//   preferredModelId?: string | null,
// ): ModelConfig {
//   const fallbackModel = preferredModelId
//     ? (models.find((model) => model.id === preferredModelId) ?? null)
//     : (models[0] ?? null);
//   const providerId = fallbackModel
//     ? normaliseProviderId(providerFromEntry(fallbackModel))
//     : (providerOptions[0]?.id ?? null);
//   const candidateModels =
//     groupedModelsByProvider[providerId ?? ""] ?? groupedModelsByProvider[""];
//   const modelId =
//     fallbackModel?.id ?? preferredModelId ?? candidateModels?.[0]?.id ?? null;
//   const label = fallbackModel?.name ?? fallbackModel?.id ?? null;

//   return {
//     key: createModelConfigKey(),
//     providerId,
//     modelId,
//     label,
//     generationOptions: {},
//     reasoning: {
//       enabled: false,
//       effort: "medium",
//       budgetTokens: "",
//     },
//     toolsJson: "null",
//     providerOptionsJson: "{}",
//     attachments: [],
//   };
// }

// export function useModelSetupsState(
//   options: UseModelSetupsStateOptions,
// ): ModelSetupsState {
//   const {
//     models,
//     providerOptions,
//     groupedModelsByProvider,
//     normaliseProviderId,
//   } = options;

//   const [configs, setConfigs] = useState<ModelConfig[]>(() => []);
//   const [errors, setErrors] = useState<Record<string, ModelConfigErrors>>({});
//   const [expandedKey, setExpandedKey] = useState<string | null>(null);

//   const replaceAllConfigs = useCallback((next: ModelConfig[]) => {
//     setConfigs(next);
//   }, []);

//   const replaceAllErrors = useCallback(
//     (next: Record<string, ModelConfigErrors>) => {
//       setErrors(next);
//     },
//     [],
//   );

//   const addConfig = useCallback(
//     (preferredModelId?: string | null) => {
//       const config = createInitialConfig(
//         models,
//         providerOptions,
//         normaliseProviderId,
//         groupedModelsByProvider,
//         preferredModelId,
//       );
//       setConfigs((prev) => [...prev, config]);
//       setExpandedKey(config.key);
//       setErrors((prev) => ({ ...prev, [config.key]: {} }));
//       return config;
//     },
//     [models, providerOptions, normaliseProviderId, groupedModelsByProvider],
//   );

//   const removeConfig = useCallback((key: string) => {
//     setConfigs((prev) => {
//       if (prev.length <= 1) return prev;
//       const next = prev.filter((config) => config.key !== key);
//       setExpandedKey((current) =>
//         current === key ? (next[0]?.key ?? null) : current,
//       );
//       return next;
//     });
//     setErrors((prev) => {
//       const next = { ...prev };
//       delete next[key];
//       return next;
//     });
//   }, []);

//   const updateConfig = useCallback(
//     (key: string, updater: (config: ModelConfig) => ModelConfig) => {
//       setConfigs((prev) =>
//         prev.map((config) => (config.key === key ? updater(config) : config)),
//       );
//     },
//     [],
//   );

//   const updateErrors = useCallback(
//     (key: string, updates: Partial<ModelConfigErrors>) => {
//       setErrors((prev) => ({
//         ...prev,
//         [key]: { ...prev[key], ...updates },
//       }));
//     },
//     [],
//   );

//   const handleProviderChange = useCallback(
//     (key: string, providerId: string | null) => {
//       const normalised = normaliseProviderId(providerId);
//       const list = groupedModelsByProvider[normalised] ?? [];
//       const nextModelId = list[0]?.id ?? null;
//       updateConfig(key, (config) => ({
//         ...config,
//         providerId: normalised,
//         modelId: nextModelId,
//         label: nextModelId
//           ? (list.find((entry) => entry.id === nextModelId)?.label ??
//             nextModelId)
//           : null,
//       }));
//       updateErrors(key, { provider: null, model: null });
//     },
//     [groupedModelsByProvider, normaliseProviderId, updateConfig, updateErrors],
//   );

//   const handleModelChange = useCallback(
//     (key: string, modelId: string | null) => {
//       const label =
//         models.find((model) => model.id === modelId)?.name ?? modelId ?? null;
//       updateConfig(key, (config) => ({
//         ...config,
//         modelId,
//         label,
//       }));
//       updateErrors(key, { model: null });
//     },
//     [models, updateConfig, updateErrors],
//   );

//   const updateGenerationOption = useCallback<
//     ModelSetupsState["updateGenerationOption"]
//   >(
//     (key, field, value) => {
//       updateConfig(key, (config) => {
//         const next = { ...config.generationOptions } as Record<string, any>;
//         if (value === undefined || value === "") delete next[field];
//         else next[field] = value;
//         return { ...config, generationOptions: next as GenerationOptionsInput };
//       });
//     },
//     [updateConfig],
//   );

//   const updateReasoning = useCallback<ModelSetupsState["updateReasoning"]>(
//     (key, updates) => {
//       updateConfig(key, (config) => ({
//         ...config,
//         reasoning: { ...config.reasoning, ...updates },
//       }));
//     },
//     [updateConfig],
//   );

//   const updateToolsJson = useCallback<ModelSetupsState["updateToolsJson"]>(
//     (key, value) => {
//       updateConfig(key, (config) => ({
//         ...config,
//         toolsJson: value,
//       }));
//       updateErrors(key, { tools: null });
//     },
//     [updateConfig, updateErrors],
//   );

//   const updateProviderOptionsJson = useCallback<
//     ModelSetupsState["updateProviderOptionsJson"]
//   >(
//     (key, value) => {
//       updateConfig(key, (config) => ({
//         ...config,
//         providerOptionsJson: value,
//       }));
//       updateErrors(key, { providerOptions: null });
//     },
//     [updateConfig, updateErrors],
//   );

//   return {
//     configs,
//     errors,
//     expandedKey,
//     setExpandedKey,
//     addConfig,
//     removeConfig,
//     replaceAllConfigs,
//     replaceAllErrors,
//     updateConfig,
//     updateErrors,
//     handleProviderChange,
//     handleModelChange,
//     updateGenerationOption,
//     updateReasoning,
//     updateToolsJson,
//     updateProviderOptionsJson,
//   };
// }

export interface ModelSetupsProps {
  // configs: ModelConfig[];
  // errors: Record<string, ModelConfigErrors>;
  // expandedKey: string | null;
  // onAddModel: () => void;
  // onRemoveModel: (key: string) => void;
  // onToggleExpand: (key: string | null) => void;
  // onProviderChange: (key: string, providerId: string | null) => void;
  // onModelChange: (key: string, modelId: string | null) => void;
  // onGenerationOptionChange: ModelSetupsState["updateGenerationOption"];
  // onReasoningChange: ModelSetupsState["updateReasoning"];
  // onToolsJsonChange: ModelSetupsState["updateToolsJson"];
  // onProviderOptionsJsonChange: ModelSetupsState["updateProviderOptionsJson"];
  // onRequestAttachments: (key: string) => void;
  // onClearAttachments: (key: string) => void;
  // addDisabled: boolean;
}

export function ModelSetups(props: ModelSetupsProps) {
  // const {
  //   configs,
  //   errors,
  //   expandedKey,
  //   onAddModel,
  //   onRemoveModel,
  //   onToggleExpand,
  //   onProviderChange,
  //   onModelChange,
  //   onGenerationOptionChange,
  //   onReasoningChange,
  //   onToolsJsonChange,
  //   onProviderOptionsJsonChange,
  //   onRequestAttachments,
  //   onClearAttachments,
  //   addDisabled,
  // } = props;

  const models = useModels();

  // const buttonLabel = configs.length > 1 ? "Add model" : "Multi model";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold">Model</h4>
        </div>

        {/* <button
          type="button"
          onClick={onAddModel}
          disabled={addDisabled}
          className="inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded disabled:opacity-60"
        >
          {buttonLabel}
        </button>
*/}
      </div>

      {/* <div className="space-y-3">
        {configs.map((config) => {
          const caps = getCapabilities(config);
          const isExpanded = expandedKey === config.key;
          const options = getModelOptions(config.providerId);
          return (
            <ModelSetup
              key={config.key}
              config={config}
              providerOptions={providerOptions}
              modelOptions={options}
              capabilities={caps}
              errors={errors[config.key] ?? {}}
              isExpanded={isExpanded}
              canRemove={configs.length > 1}
              onToggleExpand={() =>
                onToggleExpand(isExpanded ? null : config.key)
              }
              onRemove={() => onRemoveModel(config.key)}
              onProviderChange={(providerId) =>
                onProviderChange(config.key, providerId)
              }
              onModelChange={(modelId) => onModelChange(config.key, modelId)}
              onGenerationOptionChange={(field, value) =>
                onGenerationOptionChange(config.key, field, value)
              }
              onReasoningChange={(updates) =>
                onReasoningChange(config.key, updates)
              }
              onToolsJsonChange={(value) =>
                onToolsJsonChange(config.key, value)
              }
              onProviderOptionsJsonChange={(value) =>
                onProviderOptionsJsonChange(config.key, value)
              }
              onRequestAttachments={() => onRequestAttachments(config.key)}
              onClearAttachments={() => onClearAttachments(config.key)}
            />
          );
        })}
      </div> */}
    </div>
  );
}
