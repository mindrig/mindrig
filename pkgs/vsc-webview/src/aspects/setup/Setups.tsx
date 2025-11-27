import { buildSetup, buildSetupsModelRefs, Setup } from "@wrkspc/core/setup";
import { Button } from "@wrkspc/ds";
import iconRegularMicrochip from "@wrkspc/icons/svg/regular/microchip.js";
import iconRegularPlus from "@wrkspc/icons/svg/regular/plus.js";
import { Field, State } from "enso";
import { LayoutSection } from "../layout/Section";
import { useModelsMap } from "../model/MapContext";
import { SetupComponent } from "./Setup";
import { SetupsAppState } from "./setupsAppState";

export namespace Setups {
  export interface Props {
    setupsField: Field<Setup[]>;
    setupsAppState: State<SetupsAppState>;
  }
}

export function Setups(props: Setups.Props) {
  const { setupsAppState } = props;
  const { modelsPayload } = useModelsMap();
  const setupsField = props.setupsField.useCollection();
  const soloSetup = setupsField.useCompute((setups) => setups.length === 1, []);

  return (
    <LayoutSection
      header={soloSetup ? "Model" : "Models"}
      icon={iconRegularMicrochip}
      actions={
        <Button
          type="button"
          color="secondary"
          style="label"
          size="xsmall"
          icon={iconRegularPlus}
          onClick={() => {
            const usedModelRefs = buildSetupsModelRefs(setupsField.value);
            setupsField.push(
              buildSetup({
                modelsMap: modelsPayload?.map,
                usedModelRefs,
              }),
            );
          }}
        >
          Add model
        </Button>
      }
      divided
    >
      {setupsField.map((setupField, index) => (
        <div key={setupField.key} className="pb-2 last:pb-0">
          <SetupComponent
            setupField={setupField}
            solo={soloSetup}
            expandedIndexState={setupsAppState.$.expandedIndex}
            index={index}
          />
        </div>
      ))}
    </LayoutSection>
  );
}
