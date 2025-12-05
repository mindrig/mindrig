import { Model, MODEL_SETTING_TITLES, ModelSettings } from "@wrkspc/core/model";
import { InputController } from "@wrkspc/ui";
import { Field } from "enso";
import { SetupSettingsTab } from "./Tab";
import { setupSettingsLabelWithDescription } from "./utils";

export namespace SetupSettingsRepetitionControl {
  export interface Props {
    settingsField: Field<ModelSettings>;
    // TODO: Make sure capabilities are complete, then consume them here.
    modelType: Model.TypeLanguage;
  }
}

export function SetupSettingsRepetitionControl(
  props: SetupSettingsRepetitionControl.Props,
) {
  const { settingsField } = props;

  return (
    <SetupSettingsTab description="Controls how repetition is penalized.">
      <InputController
        field={settingsField.$.presencePenalty}
        label={setupSettingsLabelWithDescription({
          label: MODEL_SETTING_TITLES.presencePenalty,
          description: "Penalizes repeated topics.",
        })}
        type="number"
        step={0.1}
        min={-2}
        max={2}
        size="xsmall"
      />

      <InputController
        field={settingsField.$.frequencyPenalty}
        label={setupSettingsLabelWithDescription({
          label: MODEL_SETTING_TITLES.frequencyPenalty,
          description: "Penalizes repeated words.",
        })}
        type="number"
        step={0.1}
        min={-2}
        max={2}
        size="xsmall"
      />
    </SetupSettingsTab>
  );
}
