import { resolveModel } from "@wrkspc/core/model";
import { Setup } from "@wrkspc/core/setup";
import { Button, Icon } from "@wrkspc/ds";
import iconRegularTimes from "@wrkspc/icons/svg/regular/times.js";
import { Field, State } from "enso";
import { ModelCapabilities } from "../model/Capabilities";
import { useModelsMap } from "../model/MapContext";
import { ModelSelector } from "../model/Selector";
import { ModelSettings } from "../model/Settings";

export { SetupComponent as ModelSetup };

export namespace SetupComponent {
  export interface Props {
    setupField: Field<Setup, "detachable">;
    expandedIndexState: State<number | null>;
    solo: boolean;
    // TODO: Add ability to access index/key from the detachable field to Enso
    index: number;
  }
}

export function SetupComponent(props: SetupComponent.Props) {
  const { setupField, solo, expandedIndexState, index } = props;
  const { modelsPayload } = useModelsMap();

  const expanded = expandedIndexState.useCompute(
    (expandedIndex) => expandedIndex === index,
    [index],
  );

  const model = setupField.$.ref.useCompute(
    (ref) => resolveModel(ref, modelsPayload?.map),
    [modelsPayload?.map],
  );

  return (
    <div className="border rounded p-3 space-y-3">
      <ModelSelector field={setupField.$.ref} />

      <div className="flex flex-wrap items-center gap-3">
        {model && (
          <Button
            size="xsmall"
            style="transparent"
            onClick={() => expandedIndexState.set(expanded ? null : index)}
          >
            {expanded ? "Hide options" : "Configure"}
          </Button>
        )}

        {!solo && (
          <Button
            style="label"
            size="small"
            onClick={() => setupField.self.remove()}
            className="ml-auto inline-flex items-center justify-center h-6 w-6 rounded-full border text-xs"
          >
            <Icon id={iconRegularTimes} aria-hidden />
          </Button>
        )}
      </div>

      {model?.type && (
        <>
          <ModelCapabilities type={model.type} />

          {expanded && (
            <ModelSettings field={setupField.$.settings} type={model.type} />
          )}
        </>
      )}
    </div>
  );
}
