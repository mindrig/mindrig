import {
  buildModelSettingsReasoning,
  Model,
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
  const decomposedReasoning = field.$.reasoning.useDecompose(
    (nextReasoning, prevReasoning) => nextReasoning !== prevReasoning,
    [],
  );

  const stopSequencesField = field.$.stopSequences
    .useDefined("array")
    .useCollection();

  return (
    <div className="space-y-4 border rounded p-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InputController
          field={field.$.maxOutputTokens}
          label="Max output tokens"
          type="number"
          size="small"
          min={1}
        />

        {type.capabilities?.temperature && (
          <InputController
            field={field.$.temperature}
            label="Temperature"
            type="number"
            step={0.1}
            min={0}
            max={2}
          />
        )}

        <InputController
          field={field.$.topP}
          label="Top P"
          type="number"
          step={0.01}
          min={0}
          max={1}
        />

        <InputController
          field={field.$.topK}
          label="Top K"
          type="number"
          min={0}
        />

        <InputController
          field={field.$.presencePenalty}
          label="Presence penalty"
          type="number"
          step={0.1}
          min={-2}
          max={2}
        />

        <InputController
          field={field.$.frequencyPenalty}
          label="Frequency penalty"
          type="number"
          step={0.1}
          min={-2}
          max={2}
        />

        <div>
          <Label size="small">Stop sequences</Label>

          {stopSequencesField.map((sequenceField, index) => (
            <div>
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
          label="Seed"
          type="number"
          size="small"
        />
      </div>

      {type.capabilities?.reasoning && (
        <div className="space-y-2">
          <CheckboxController
            field={enableReasoningField}
            label="Enable reasoning"
          />

          {decomposedReasoning.value?.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SelectController
                field={decomposedReasoning.field.$.effort}
                options={modelSettingsReasoningEffort.map((effort) => ({
                  value: effort,
                }))}
                label="Reasoning effort"
              />

              <InputController
                type="number"
                field={decomposedReasoning.field.$.budgetTokens}
                label="Budget tokens"
                min={0}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
