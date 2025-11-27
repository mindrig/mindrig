import {
  buildModelSettingsReasoning,
  Model,
  MODEL_SETTING_REASONING_TITLES,
  MODEL_SETTING_TITLES,
  ModelSettings,
  modelSettingsReasoningEffort,
} from "@wrkspc/core/model";
import { Button, Icon, textCn } from "@wrkspc/ds";
import {
  CheckboxController,
  Description,
  InputController,
  Label,
  SelectController,
} from "@wrkspc/form";
import iconRegularPlus from "@wrkspc/icons/svg/regular/plus.js";
import iconRegularTrashAlt from "@wrkspc/icons/svg/regular/trash-alt.js";
import iconSolidQuestionCircle from "@wrkspc/icons/svg/solid/question-circle.js";
import { Field } from "enso";
import React from "react";

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
    <div className="flex flex-col gap-3 divide-y divide-divider">
      <Section
        header="Output Limits"
        description="Controls how generation stops."
      >
        <InputController
          field={field.$.maxOutputTokens}
          label={labelWithDescription({
            label: MODEL_SETTING_TITLES.maxOutputTokens,
            description: "Max tokens to generate.",
          })}
          type="number"
          size="xsmall"
          min={1}
        />

        <div className="col-span-2 flex flex-col gap-1">
          <LabelWithDescription
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
      </Section>

      <Section
        header="Creativity & Sampling"
        description="Controls randomness and sampling."
      >
        {/* TODO: Make sure capabilities are present for all models. */}
        {/* {type.capabilities?.temperature && ( */}
        <InputController
          field={field.$.temperature}
          label={labelWithDescription({
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
          field={field.$.topP}
          label={labelWithDescription({
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
          field={field.$.topK}
          label={labelWithDescription({
            label: MODEL_SETTING_TITLES.topK,
            description: "Top-K token cutoff.",
          })}
          type="number"
          min={0}
          size="xsmall"
        />
      </Section>

      <Section
        header="Repetition Control"
        description="Controls how repetition is penalized."
      >
        <InputController
          field={field.$.presencePenalty}
          label={labelWithDescription({
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
          field={field.$.frequencyPenalty}
          label={labelWithDescription({
            label: MODEL_SETTING_TITLES.frequencyPenalty,
            description: "Penalizes repeated words.",
          })}
          type="number"
          step={0.1}
          min={-2}
          max={2}
          size="xsmall"
        />
      </Section>

      <Section
        header="Reproducibility"
        description="Controls output consistency."
      >
        <InputController
          field={field.$.seed}
          label={labelWithDescription({
            label: MODEL_SETTING_TITLES.seed,
            description: "Fixes randomness.",
          })}
          type="number"
          size="xsmall"
        />
      </Section>

      {type.capabilities?.reasoning && (
        <Section header="Reasoning" description="Controls reasoning mode.">
          <div className="col-span-2">
            <CheckboxController
              field={enableReasoningField}
              label={labelWithDescription({
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
                label={labelWithDescription({
                  label: MODEL_SETTING_REASONING_TITLES.effort,
                  description: "Sets reasoning depth.",
                })}
                size="xsmall"
              />

              <InputController
                type="number"
                field={decomposedReasoning.field.$.budgetTokens}
                label={labelWithDescription({
                  label: MODEL_SETTING_REASONING_TITLES.budgetTokens,
                  description: "Token limit for reasoning.",
                })}
                min={0}
                size="xsmall"
              />
            </>
          )}
        </Section>
      )}
    </div>
  );
}

namespace Section {
  export interface Props {
    header: string;
    description: string;
  }
}

function Section(props: React.PropsWithChildren<Section.Props>) {
  const { header: title, description, children } = props;

  return (
    <div className="flex flex-col gap-3 pb-3 last:pb-0">
      <div className="flex flex-col gap-1">
        <h5
          className={textCn({
            role: "subheader",
            size: "xsmall",
            className: "flex items-center gap-1",
          })}
        >
          {props.header}
        </h5>

        <Description size="small">{description}</Description>
      </div>

      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

namespace LabelWithDescription {
  export interface Props {
    label: string;
    description?: string | undefined;
  }
}

function LabelWithDescription(props: LabelWithDescription.Props) {
  const { label, description } = props;

  return (
    <div className="flex items-center gap-1" title={description}>
      <Label size="small">{label}</Label>

      <div className="inline-flex">
        <HelpIcon />
      </div>
    </div>
  );
}

function labelWithDescription(props: LabelWithDescription.Props) {
  const { label, description } = props;
  return {
    label: <LabelWithDescription label={label} description={description} />,
    a11y: "Maximum output tokens",
  };
}

function HelpIcon() {
  return <Icon id={iconSolidQuestionCircle} size="xsmall" color="detail" />;
}
