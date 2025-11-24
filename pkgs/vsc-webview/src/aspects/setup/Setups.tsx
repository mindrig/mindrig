import { buildSetup, buildSetupsModelRefs, Setup } from "@wrkspc/core/setup";
import { Button } from "@wrkspc/ds";
import { Field, State } from "enso";
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold">
            {soloSetup ? "Model" : "Models"}
          </h4>
        </div>

        <Button
          type="button"
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
          {soloSetup ? "Multi model" : "Add model"}
        </Button>
      </div>

      <div className="space-y-3">
        {setupsField.map((setupField, index) => (
          <SetupComponent
            key={setupField.key}
            setupField={setupField}
            solo={soloSetup}
            expandedIndexState={setupsAppState.$.expandedIndex}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
