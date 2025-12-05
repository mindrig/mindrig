import { Model, MODEL_SETTING_TITLES, ModelSettings } from "@wrkspc/core/model";
import { InputController } from "@wrkspc/ui";
import { Field } from "enso";
import { SetupSettingsTab } from "./Tab";
import { setupSettingsLabelWithDescription } from "./utils";

export namespace SetupSettingsReproducibility {
  export interface Props {
    settingsField: Field<ModelSettings>;
    // TODO: Make sure capabilities are complete, then consume them here.
    modelType: Model.TypeLanguage;
  }
}

export function SetupSettingsReproducibility(
  props: SetupSettingsReproducibility.Props,
) {
  const { settingsField } = props;

  return (
    <SetupSettingsTab description="Controls output consistency.">
      <InputController
        field={settingsField.$.seed}
        label={setupSettingsLabelWithDescription({
          label: MODEL_SETTING_TITLES.seed,
          description: "Fixes randomness.",
        })}
        type="number"
        size="xsmall"
      />
    </SetupSettingsTab>
  );
}
