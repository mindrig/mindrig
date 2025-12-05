import { Model, MODEL_SETTING_TITLES, ModelSettings } from "@wrkspc/core/model";
import { InputController } from "@wrkspc/ui";
import { Field } from "enso";
import { SetupSettingsTab } from "./Tab";
import { setupSettingsLabelWithDescription } from "./utils";

export namespace SetupSettingsCreativityAndSampling {
  export interface Props {
    settingsField: Field<ModelSettings>;
    // TODO: Make sure capabilities are complete, then consume them here.
    modelType: Model.TypeLanguage;
  }
}

export function SetupSettingsCreativityAndSampling(
  props: SetupSettingsCreativityAndSampling.Props,
) {
  const { settingsField } = props;

  return (
    <SetupSettingsTab description="Controls randomness and sampling.">
      {/* TODO: Make sure capabilities are present for all models. */}
      {/* {type.capabilities?.temperature && ( */}
      <InputController
        field={settingsField.$.temperature}
        label={setupSettingsLabelWithDescription({
          label: MODEL_SETTING_TITLES.temperature,
          description: "Randomness level.",
        })}
        type="number"
        step={0.1}
        min={0}
        max={2}
        size="xsmall"
      />
      {/* )} */}

      <InputController
        field={settingsField.$.topP}
        label={setupSettingsLabelWithDescription({
          label: MODEL_SETTING_TITLES.topP,
          description: "Probability-mass cutoff.",
        })}
        type="number"
        step={0.01}
        min={0}
        max={1}
        size="xsmall"
      />

      <InputController
        field={settingsField.$.topK}
        label={setupSettingsLabelWithDescription({
          label: MODEL_SETTING_TITLES.topK,
          description: "Top-K token cutoff.",
        })}
        type="number"
        min={0}
        size="xsmall"
      />
    </SetupSettingsTab>
  );
}
