import {
  buildModelSettingsReasoning,
  Model,
  MODEL_SETTING_REASONING_TITLES,
  ModelSettings,
  modelSettingsReasoningEffort,
} from "@wrkspc/core/model";
import {
  CheckboxController,
  InputController,
  SelectController,
} from "@wrkspc/ui";
import { Field } from "enso";
import { SetupSettingsTab } from "./Tab";
import { setupSettingsLabelWithDescription } from "./utils";

export namespace SetupSettingsReasoning {
  export interface Props {
    settingsField: Field<ModelSettings>;
    modelType: Model.TypeLanguage;
  }
}

export function SetupSettingsReasoning(props: SetupSettingsReasoning.Props) {
  const { settingsField, modelType } = props;

  const enableReasoningField = settingsField.$.reasoning
    .useInto((reasoning) => !!reasoning?.enabled, [])
    .from(
      (enabled) => (enabled ? buildModelSettingsReasoning() : undefined),
      [],
    );
  const decomposedReasoning = settingsField.$.reasoning.useDecomposeNullish();

  if (!modelType.capabilities?.reasoning)
    return (
      <SetupSettingsTab description="Reasoning is not supported by the model." />
    );

  return (
    <SetupSettingsTab description="Controls reasoning mode.">
      <div className="col-span-2">
        <CheckboxController
          field={enableReasoningField}
          label={setupSettingsLabelWithDescription({
            label: MODEL_SETTING_REASONING_TITLES.enabled,
            description: "Enables reasoning mode.",
          })}
          size="xsmall"
        />
      </div>

      {decomposedReasoning.value?.enabled && (
        <>
          <SelectController
            field={decomposedReasoning.field.$.effort}
            options={modelSettingsReasoningEffort.map((effort) => ({
              value: effort,
            }))}
            label={setupSettingsLabelWithDescription({
              label: MODEL_SETTING_REASONING_TITLES.effort,
              description: "Sets reasoning depth.",
            })}
            size="xsmall"
          />

          <InputController
            type="number"
            field={decomposedReasoning.field.$.budgetTokens}
            label={setupSettingsLabelWithDescription({
              label: MODEL_SETTING_REASONING_TITLES.budgetTokens,
              description: "Token limit for reasoning.",
            })}
            min={0}
            size="xsmall"
          />
        </>
      )}
    </SetupSettingsTab>
  );
}
