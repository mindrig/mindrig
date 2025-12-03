import { Size } from "@wrkspc/ds";
import { cn } from "crab";
import React from "react";

export namespace LayoutInner {
  export interface Props extends cn.Props<typeof layoutInnerCn> {}

  export type Pad = boolean | "x" | "y";

  export type Divide = false | "top" | "bottom";
}

export function LayoutInner(props: React.PropsWithChildren<LayoutInner.Props>) {
  const { children } = props;
  return <div className={layoutInnerCn(props)}>{children}</div>;
}

export const layoutInnerCn = cn<{
  size: Size;
  pad: LayoutInner.Pad;
  divide: LayoutInner.Divide;
}>()
  .base("")
  .size("medium", {
    xsmall: {
      pad: {
        true: "p-2",
        x: "px-2",
        y: "py-2",
      },
    },
    small: {
      pad: {
        true: "p-3",
        x: "px-3",
        y: "py-3",
      },
    },
    medium: {
      pad: {
        true: "p-4",
        x: "px-4",
        y: "py-4",
      },
    },
    large: {
      pad: {
        true: "p-6",
        x: "px-6",
        y: "py-6",
      },
    },
    xlarge: {
      pad: {
        true: "p-8",
        x: "px-8",
        y: "py-8",
      },
    },
  })
  .pad(false)
  .divide(false, {
    top: "border-t border-divider",
    bottom: "border-b border-divider",
  });
