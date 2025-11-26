import {
  buildModelSettingsReasoning,
  Model,
  MODEL_SETTING_REASONING_TITLES,
  MODEL_SETTING_TITLES,
  ModelSettings,
  modelSettingsReasoningEffort,
} from "@wrkspc/core/model";
import { Button } from "@wrkspc/ds";
import {
  CheckboxController,
  InputController,
  Label,
  SelectController,
} from "@wrkspc/form";
import iconRegularTimes from "@wrkspc/icons/svg/regular/times.js";
import { Field } from "enso";

export namespace ModelTypeLanguageSettings {
  export interface Props {
    field: Field<ModelSettings>;
    type: Model.TypeLanguage;
  }
}

export function ModelTypeLanguageSettings(
  props: ModelTypeLanguageSettings.Props,
) {
  const { field, type } = props;

  const enableReasoningField = field.$.reasoning
    .useInto((reasoning) => !!reasoning?.enabled, [])
    .from(
      (enabled) => (enabled ? buildModelSettingsReasoning() : undefined),
      [],
    );
  const decomposedReasoning = field.$.reasoning.useDecomposeNullish();

  const stopSequencesField = field.$.stopSequences
    .useDefined("array")
    .useCollection();

  return (
    <div className="space-y-4 border rounded p-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InputController
          field={field.$.maxOutputTokens}
          label={MODEL_SETTING_TITLES.maxOutputTokens}
          type="number"
          size="small"
          min={1}
        />

        {type.capabilities?.temperature && (
          <InputController
            field={field.$.temperature}
            label={MODEL_SETTING_TITLES.temperature}
            type="number"
            step={0.1}
            min={0}
            max={2}
          />
        )}

        <InputController
          field={field.$.topP}
          label={MODEL_SETTING_TITLES.topP}
          type="number"
          step={0.01}
          min={0}
          max={1}
        />

        <InputController
          field={field.$.topK}
          label={MODEL_SETTING_TITLES.topK}
          type="number"
          min={0}
        />

        <InputController
          field={field.$.presencePenalty}
          label={MODEL_SETTING_TITLES.presencePenalty}
          type="number"
          step={0.1}
          min={-2}
          max={2}
        />

        <InputController
          field={field.$.frequencyPenalty}
          label={MODEL_SETTING_TITLES.frequencyPenalty}
          type="number"
          step={0.1}
          min={-2}
          max={2}
        />

        <div>
          <Label size="small">{MODEL_SETTING_TITLES.stopSequences}</Label>

          {stopSequencesField.map((sequenceField, index) => (
            <div key={sequenceField.id}>
              <InputController
                label={{ a11y: `Stop sequence #${index + 1}` }}
                field={sequenceField}
                placeholder="Enter stop sequence..."
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                key={sequenceField.key}
              />

              <Button
                size="small"
                style="label"
                icon={iconRegularTimes}
                onClick={() => sequenceField.self.remove()}
              />
            </div>
          ))}

          <Button
            size="small"
            style="transparent"
            onClick={() => stopSequencesField.push("")}
          >
            Add stop sequence
          </Button>
        </div>

        <InputController
          field={field.$.seed}
          label={MODEL_SETTING_TITLES.seed}
          type="number"
          size="small"
        />
      </div>

      {type.capabilities?.reasoning && (
        <div className="space-y-2">
          <CheckboxController
            field={enableReasoningField}
            label={MODEL_SETTING_TITLES.reasoning}
          />

          {decomposedReasoning.value?.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SelectController
                field={decomposedReasoning.field.$.effort}
                options={modelSettingsReasoningEffort.map((effort) => ({
                  value: effort,
                }))}
                label={MODEL_SETTING_REASONING_TITLES.effort}
              />

              <InputController
                type="number"
                field={decomposedReasoning.field.$.budgetTokens}
                label={MODEL_SETTING_REASONING_TITLES.budgetTokens}
                min={0}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
