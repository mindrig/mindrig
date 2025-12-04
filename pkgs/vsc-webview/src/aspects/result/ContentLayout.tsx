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
    <Block dir="y" gap={false}>
      <Block size="small" justify="between" gap={false}>
        {nav}

        <Block border="bottom" pad={{ left: "medium" }}>
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
      </Block>

      <Block pad="y">{children}</Block>
    </Block>
  );
}
