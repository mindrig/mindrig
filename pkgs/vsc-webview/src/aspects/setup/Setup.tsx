import { resolveModel } from "@wrkspc/core/model";
import { Setup } from "@wrkspc/core/setup";
import { Button } from "@wrkspc/ds";
import iconRegularAngleUp from "@wrkspc/icons/svg/regular/angle-up.js";
import iconRegularCog from "@wrkspc/icons/svg/regular/cog.js";
import iconRegularTrashAlt from "@wrkspc/icons/svg/regular/trash-alt.js";
import { Field, State } from "enso";
import { LayoutBlock } from "../layout/Block";
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
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="grow">
          <ModelSelector field={setupField.$.ref} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {model && (
            <Button
              style="label"
              color="secondary"
              size="small"
              icon={expanded ? iconRegularAngleUp : iconRegularCog}
              onClick={() => expandedIndexState.set(expanded ? null : index)}
            />
          )}

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

          {expanded && (
            <LayoutBlock size="small" bordered>
              <ModelSettings field={setupField.$.settings} type={model.type} />
            </LayoutBlock>
          )}
        </>
      )}
    </div>
  );
}
