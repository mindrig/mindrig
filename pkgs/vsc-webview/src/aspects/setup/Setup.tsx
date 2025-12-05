import { resolveModel } from "@wrkspc/core/model";
import { Setup } from "@wrkspc/core/setup";
import { Button } from "@wrkspc/ds";
import iconRegularChevronDown from "@wrkspc/icons/svg/regular/chevron-down.js";
import iconRegularCog from "@wrkspc/icons/svg/regular/cog.js";
import iconRegularTrashAlt from "@wrkspc/icons/svg/regular/trash-alt.js";
import { Field } from "enso";
import { ModelCapabilities } from "../model/Capabilities";
import { useModelsMap } from "../model/MapContext";
import { ModelSelector } from "../model/Selector";
import { SetupProvider, useSetup } from "./Context";
import { SetupSettings } from "./settings/Settings";

export namespace SetupComponent {
  export interface Props {
    setupField: Field<Setup, "detachable">;
    solo: boolean;
  }
}

export function SetupComponent(props: SetupComponent.Props) {
  const { setupField } = props;

  return (
    <SetupProvider setupField={setupField}>
      <Content {...props} />
    </SetupProvider>
  );
}

function Content(props: SetupComponent.Props) {
  const { setupField, solo } = props;
  const { setup } = useSetup();
  const { modelsPayload } = useModelsMap();

  const showSettings = setup.useShowSettings();

  const model = setupField.$.ref.useCompute(
    (ref) => resolveModel(ref, modelsPayload?.map),
    [modelsPayload?.map],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <div className="shrink-0">
          <Button
            style="label"
            color="secondary"
            size="small"
            icon={showSettings ? iconRegularChevronDown : iconRegularCog}
            onClick={() =>
              showSettings ? setup.hideSettings() : setup.showSettings()
            }
            isDisabled={!model}
          />
        </div>

        <div className="grow">
          <ModelSelector field={setupField.$.ref} />
        </div>

        <div className="shrink-0">
          {!solo && (
            <Button
              style="label"
              color="secondary"
              size="small"
              onClick={() => setupField.self.remove()}
              icon={iconRegularTrashAlt}
            />
          )}
        </div>
      </div>

      {model?.type && (
        <>
          <ModelCapabilities type={model.type} />

          {showSettings && (
            <SetupSettings field={setupField.$.settings} type={model.type} />
          )}
        </>
      )}
    </div>
  );
}
