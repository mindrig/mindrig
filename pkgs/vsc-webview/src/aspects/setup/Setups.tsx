import { DEMO_GATEWAY_MODEL_ID } from "@wrkspc/core/gateway";
import { buildSetup, buildSetupsModelRefs, Setup } from "@wrkspc/core/setup";
import { Button, Notice, Tag } from "@wrkspc/ds";
import iconRegularPlus from "@wrkspc/icons/svg/regular/plus.js";
import iconRegularWarning from "@wrkspc/icons/svg/regular/warning.js";
import { Field } from "enso";
import { useState } from "react";
import { useAuth } from "../auth/Context";
import { LayoutSection } from "../layout/Section";
import { useModelsMap } from "../model/MapContext";
import { pageHrefs } from "../page/route";
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
  const { gateway } = useAuth();

  const didSetUpGateway = !!gateway.gateway;

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
      {!didSetUpGateway && (
        <Notice
          size="small"
          icon={iconRegularWarning}
          actions={
            <Button href={pageHrefs.auth()} size="small">
              Set Up
            </Button>
          }
        >
          AI gateway is not configured. All requests will be served by{" "}
          {DEMO_GATEWAY_MODEL_ID}. Enter your API key to use any models you
          like.
        </Notice>
      )}

      {setupsField.map((setupField, index) => (
        <div key={setupField.key} className="pb-2 last:pb-0">
          <SetupComponent setupField={setupField} solo={soloSetup} />
        </div>
      ))}
    </LayoutSection>
  );
}
