import {
  MODEL_SETTING_REASONING_TITLES,
  MODEL_SETTING_TITLES,
  ModelSettings,
  resolveModel,
  resolveModelDeveloper,
} from "@wrkspc/core/model";
import { Setup } from "@wrkspc/core/setup";
import { useMemo } from "react";
import { useModelsMap } from "../model/MapContext";

export namespace SetupPreview {
  export interface Props {
    setup: Setup;
  }
}

export function SetupPreview(props: SetupPreview.Props) {
  const { setup } = props;
  const { modelsPayload } = useModelsMap();

  const developer = useMemo(
    () => resolveModelDeveloper(setup.ref?.developerId, modelsPayload?.map),
    [setup, modelsPayload?.map],
  );

  const model = useMemo(
    () => resolveModel(setup.ref, modelsPayload?.map),
    [setup, modelsPayload?.map],
  );

  const settings = Object.entries(setup.settings).map((pairArg) => {
    const [setting, value] = pairArg as ModelSettings.Pair;
    // Exclude internal fields as well as nullish values
    if (setting === "v" || setting === "type" || value == null) return null;

    switch (setting) {
      case "reasoning":
        if (!value.enabled) return null;
        return (
          <div key={setting}>
            <div>{MODEL_SETTING_TITLES.reasoning}</div>

            <div className="flex gap-2">
              <div>{MODEL_SETTING_REASONING_TITLES.effort}:</div>
              <div>{value.effort}</div>
            </div>

            {value.budgetTokens != null && (
              <div className="flex gap-2">
                <div>{MODEL_SETTING_REASONING_TITLES.budgetTokens}:</div>
                <div>{value.budgetTokens}</div>
              </div>
            )}
          </div>
        );

      case "stopSequences":
        if (!value.length) return null;
        return (
          <div key={setting}>
            {MODEL_SETTING_TITLES[setting]}: {value.join(", ")}
          </div>
        );

      default:
        return (
          <div className="flex gap-2" key={setting}>
            <div>{MODEL_SETTING_TITLES[setting]}:</div>
            <div>{value}</div>
          </div>
        );
    }
  });

  return (
    <div>
      <div>
        <div className="flex gap-2">
          <div>Developer</div>
          <div>{developer?.meta?.name || developer?.id || "Unknown"}</div>
        </div>

        <div className="flex gap-2">
          <div>Model</div>
          <div>{model?.name || model?.id || "Unknown"}</div>
        </div>
      </div>

      {settings.length && (
        <div>
          <h3>Settings</h3>

          {settings}
        </div>
      )}
    </div>
  );
}
