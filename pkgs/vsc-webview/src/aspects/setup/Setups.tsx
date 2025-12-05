import { buildSetup, buildSetupsModelRefs, Setup } from "@wrkspc/core/setup";
import { Button, Tag } from "@wrkspc/ds";
import iconRegularPlus from "@wrkspc/icons/svg/regular/plus.js";
import { Field } from "enso";
import { useState } from "react";
import { LayoutSection } from "../layout/Section";
import { useModelsMap } from "../model/MapContext";
import { SetupComponent } from "./Setup";
import { SetupsModelsLabels } from "./SetupsModelsLabel";

export namespace Setups {
  export interface Props {
    setupsField: Field<Setup[]>;
  }
}

export function Setups(props: Setups.Props) {
  const { modelsPayload } = useModelsMap();
  const setupsField = props.setupsField.useCollection();
  const soloSetup = setupsField.useCompute((setups) => setups.length === 1, []);
  const [expanded, setExpanded] = useState(true);

  return (
    <LayoutSection
      collapsible
      header={(expanded) => (
        <div className="flex gap-2 items-center">
          <span className="shrink-0">
            {`${soloSetup ? "Model" : "Models"} to use`}{" "}
          </span>
          <span className="shrink-0">
            <Tag size="xsmall">{setupsField.size}</Tag>
          </span>
          {!expanded && <SetupsModelsLabels setupsField={setupsField} />}
        </div>
      )}
      actions={
        <Button
          type="button"
          color="secondary"
          style="label"
          size="xsmall"
          icon={iconRegularPlus}
          onClick={() => {
            !expanded && setExpanded(true);
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
      expanded={[expanded, setExpanded]}
      divided
    >
      {setupsField.map((setupField, index) => (
        <div key={setupField.key} className="pb-2 last:pb-0">
          <SetupComponent setupField={setupField} solo={soloSetup} />
        </div>
      ))}
    </LayoutSection>
  );
}
