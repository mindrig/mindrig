import { Setup } from "@wrkspc/core/setup";
import { Button, Icon } from "@wrkspc/ds";
import iconRegularTimes from "@wrkspc/icons/svg/regular/times.js";
import { Field } from "enso";
import { ModelSelector } from "../model/Selector";
import { ModelSettings } from "../model/Settings";

export { SetupComponent as ModelSetup };

export namespace SetupComponent {
  export interface Props {
    field: Field<Setup, "detachable">;
    solo: boolean;
    // config: ModelConfig;
    // providerOptions: ProviderOption[];
    // modelOptions: ModelOption[];
    // capabilities: ModelCapabilities;
    // errors: ModelConfigErrors;
    // isExpanded: boolean;
    // canRemove: boolean;
    // onToggleExpand: () => void;
    // onRemove: () => void;
    // onProviderChange: (providerId: string | null) => void;
    // onModelChange: (modelId: string | null) => void;
    // onGenerationOptionChange: (
    //   field:
    //     | "maxOutputTokens"
    //     | "temperature"
    //     | "topP"
    //     | "topK"
    //     | "presencePenalty"
    //     | "frequencyPenalty"
    //     | "stopSequences"
    //     | "seed",
    //   value: number | string | undefined,
    // ) => void;
    // onReasoningChange: (updates: Partial<ModelConfig["reasoning"]>) => void;
    // onToolsJsonChange: (value: string) => void;
    // onProviderOptionsJsonChange: (value: string) => void;
    // onRequestAttachments: () => void;
    // onClearAttachments: () => void;
  }
}

export function SetupComponent(props: SetupComponent.Props) {
  const { field, solo } = props;
  // const {
  //   config,
  //   providerOptions,
  //   modelOptions,
  //   capabilities,
  //   errors,
  //   isExpanded,
  //   canRemove,
  //   onToggleExpand,
  //   onRemove,
  //   onProviderChange,
  //   onModelChange,
  //   onGenerationOptionChange,
  //   onReasoningChange,
  //   onToolsJsonChange,
  //   onProviderOptionsJsonChange,
  //   onRequestAttachments,
  //   onClearAttachments,
  // } = props;

  // const logoUrl = capabilities.provider
  //   ? providerLogoUrl(capabilities.provider, { format: "svg" })
  //   : "";

  const isExpanded = false; // TODO

  return (
    <div className="border rounded p-3 space-y-3">
      <ModelSelector field={field.$.ref} />

      <div className="flex flex-wrap items-center gap-3">
        {/* {logoUrl && (
          <img src={logoUrl} alt={capabilities.provider} className="h-5 w-5" />
        )} */}

        {/* <Button size="xsmall" style="transparent" onClick={onToggleExpand}>
          {isExpanded ? "Hide options" : "Configure"}
        </Button> */}

        {!solo && (
          <Button
            style="label"
            size="small"
            onClick={() => field.self.remove()}
            className="ml-auto inline-flex items-center justify-center h-6 w-6 rounded-full border text-xs"
            // title="Remove model setup"
          >
            <Icon id={iconRegularTimes} aria-hidden />
          </Button>
        )}
      </div>

      {/* {config.modelId && (
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
      )} */}

      {isExpanded && (
        <ModelSettings
        // config={config}
        // errors={errors}
        // caps={capabilities}
        // attachments={config.attachments}
        // onRequestAttachments={onRequestAttachments}
        // onClearAttachments={onClearAttachments}
        // onGenerationOptionChange={onGenerationOptionChange}
        // onReasoningChange={onReasoningChange}
        // onToolsJsonChange={onToolsJsonChange}
        // onProviderOptionsJsonChange={onProviderOptionsJsonChange}
        />
      )}
    </div>
  );
}
