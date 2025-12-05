import { Model, MODEL_SETTING_TITLES, ModelSettings } from "@wrkspc/core/model";
import { Button } from "@wrkspc/ds";
import iconRegularPlus from "@wrkspc/icons/svg/regular/plus.js";
import iconRegularTrashAlt from "@wrkspc/icons/svg/regular/trash-alt.js";
import { InputController } from "@wrkspc/ui";
import { Field } from "enso";
import { SetupSettingsTab } from "./Tab";
import {
  SetupSettingsLabelWithDescription,
  setupSettingsLabelWithDescription,
} from "./utils";

export namespace SetupSettingsOutputLimits {
  export interface Props {
    settingsField: Field<ModelSettings>;
    // TODO: Make sure capabilities are complete, then consume them here.
    modelType: Model.TypeLanguage;
  }
}

export function SetupSettingsOutputLimits(
  props: SetupSettingsOutputLimits.Props,
) {
  const { settingsField } = props;

  const stopSequencesField = settingsField.$.stopSequences
    .useDefined("array")
    .useCollection();

  return (
    <SetupSettingsTab description="Controls how generation stops.">
      <InputController
        field={settingsField.$.maxOutputTokens}
        label={setupSettingsLabelWithDescription({
          label: MODEL_SETTING_TITLES.maxOutputTokens,
          description: "Max tokens to generate.",
        })}
        type="number"
        size="xsmall"
        min={1}
      />

      <div className="col-span-2 flex flex-col gap-1">
        <SetupSettingsLabelWithDescription
          label={MODEL_SETTING_TITLES.stopSequences}
          description="Strings that cause generation to stop."
        />

        {stopSequencesField.map((sequenceField, index) => (
          <div key={sequenceField.id} className="flex gap-1">
            <div className="grow">
              <InputController
                label={{ a11y: `Stop sequence #${index + 1}` }}
                field={sequenceField}
                size="xsmall"
              />
            </div>

            <Button
              style="label"
              icon={iconRegularTrashAlt}
              onClick={() => sequenceField.self.remove()}
              size="xsmall"
            />
          </div>
        ))}

        <div>
          <Button
            style="label"
            color="secondary"
            onClick={() => stopSequencesField.push("")}
            icon={iconRegularPlus}
            size="xsmall"
          >
            Add
          </Button>
        </div>
      </div>
    </SetupSettingsTab>
  );
}
