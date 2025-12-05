import { Block, Button } from "@wrkspc/ds";
import iconRegularEyeSlash from "@wrkspc/icons/svg/regular/eye-slash.js";
import iconRegularEye from "@wrkspc/icons/svg/regular/eye.js";
import React from "react";
import { useResult } from "./Context";

export namespace ResultContentLayout {
  export interface Props {
    nav?: React.ReactNode | undefined;
  }
}

export function ResultContentLayout(
  props: React.PropsWithChildren<ResultContentLayout.Props>,
) {
  const { nav, children } = props;
  const { resultAppState } = useResult();

  const tab = resultAppState.$.tab.useValue();

  return (
    <Block dir="y">
      <Block size="small" align justify="between" border="bottom">
        <Block size="small" pad={["xsmall", false]}>
          <Button
            size="small"
            color="secondary"
            style="label"
            icon={tab ? iconRegularEyeSlash : iconRegularEye}
            onClick={() =>
              resultAppState.$.tab.set(tab ? undefined : "request")
            }
          >
            {tab ? "Hide" : "Show"} details
          </Button>
        </Block>

        <div>{nav}</div>
      </Block>

      <Block>{children}</Block>
    </Block>
  );
}
