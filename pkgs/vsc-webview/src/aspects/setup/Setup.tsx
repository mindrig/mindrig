import { Setup } from "@wrkspc/core/setup";
import { Button, Icon } from "@wrkspc/ds";
import iconRegularTimes from "@wrkspc/icons/svg/regular/times.js";
import { Field, State } from "enso";
import { ModelSelector } from "../model/Selector";
import { ModelSettings } from "../model/Settings";
import { SetupCapabilities } from "./Capabilities";

export { SetupComponent as ModelSetup };

export namespace SetupComponent {
  export interface Props {
    field: Field<Setup, "detachable">;
    expandedIndexState: State<number | null>;
    solo: boolean;
    // TODO: Add ability to access index/key from the detachable field to Enso
    index: number;
  }
}

export function SetupComponent(props: SetupComponent.Props) {
  const { field, solo, expandedIndexState, index } = props;

  const expanded = expandedIndexState.useCompute(
    (expandedIndex) => expandedIndex === index,
    [index],
  );

  return (
    <div className="border rounded p-3 space-y-3">
      <ModelSelector field={field.$.ref} />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="xsmall"
          style="transparent"
          onClick={() => expandedIndexState.set(expanded ? null : index)}
        >
          {expanded ? "Hide options" : "Configure"}
        </Button>

        {!solo && (
          <Button
            style="label"
            size="small"
            onClick={() => field.self.remove()}
            className="ml-auto inline-flex items-center justify-center h-6 w-6 rounded-full border text-xs"
          >
            <Icon id={iconRegularTimes} aria-hidden />
          </Button>
        )}
      </div>

      <SetupCapabilities />

      {expanded && <ModelSettings field={field.$.settings} />}
    </div>
  );
}
