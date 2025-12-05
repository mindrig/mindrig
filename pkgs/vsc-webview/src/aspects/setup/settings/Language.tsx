import { Model, ModelSettings } from "@wrkspc/core/model";
import { Tabs } from "@wrkspc/ui";
import { Field } from "enso";
import { useSetup } from "../Context";
import { SetupSettingsCreativityAndSampling } from "./CreativityAndSampling";
import { SetupSettingsOutputLimits } from "./OutputLimits";
import { SetupSettingsReasoning } from "./Reasoning";
import { SetupSettingsRepetitionControl } from "./RepetitionControl";
import { SetupSettingsReproducibility } from "./Reproducibility";

export namespace SetupSettingsLanguage {
  export interface Props {
    settingsField: Field<ModelSettings>;
    modelType: Model.TypeLanguage;
  }
}

export function SetupSettingsLanguage(props: SetupSettingsLanguage.Props) {
  const { settingsField, modelType } = props;
  const { setup } = useSetup();

  const tab = setup.useSettingsTab();

  return (
    <Tabs
      size="xsmall"
      style="tags"
      collapsible={{ id: null }}
      onChange={(tab) => (tab ? setup.showSettings(tab) : setup.hideSettings())}
      items={[
        {
          id: "output-limits",
          label: "Output Limits",
          content: () => (
            <SetupSettingsOutputLimits
              settingsField={settingsField}
              modelType={modelType}
            />
          ),
        },
        {
          id: "creativity-and-sampling",
          label: "Creativity & Sampling",
          content: () => (
            <SetupSettingsCreativityAndSampling
              settingsField={settingsField}
              modelType={modelType}
            />
          ),
        },
        {
          id: "repetition-control",
          label: "Repetition Control",
          content: () => (
            <SetupSettingsRepetitionControl
              settingsField={settingsField}
              modelType={modelType}
            />
          ),
        },
        {
          id: "reproducibility",
          label: "Reproducibility",
          content: () => (
            <SetupSettingsReproducibility
              settingsField={settingsField}
              modelType={modelType}
            />
          ),
        },
        {
          id: "reasoning",
          label: "Reasoning",
          content: () => (
            <SetupSettingsReasoning
              settingsField={settingsField}
              modelType={modelType}
            />
          ),
        },
      ]}
    />
  );
}
