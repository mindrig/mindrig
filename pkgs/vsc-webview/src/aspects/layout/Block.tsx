import { Size } from "@wrkspc/ds";
import { cn } from "crab";

export namespace LayoutBlock {
  export interface Props extends cn.Props<typeof layoutBlockCn> {}

  export type Style = "default" | "tabs";
}

export function LayoutBlock(props: React.PropsWithChildren<LayoutBlock.Props>) {
  return <section className={layoutBlockCn(props)}>{props.children}</section>;
}

export const layoutBlockCn = cn<{
  size: Size;
  style: LayoutBlock.Style;
  bordered: boolean;
  divided: boolean;
}>()
  .base("flex flex-col bg-block-canvas")
  .size("medium", {
    xsmall: "gap-2 px-2",
    small: "gap-3 px-3",
    medium: "gap-4 px-4",
    large: "gap-5 px-5",
    xlarge: "gap-6 px-6",
  })
  .bordered(false, {
    true: "border border-block-border bg-block-canvas",
  })
  .divided(false, {
    true: "divide-y divide-divider",
  })
  .style("default", {
    default: {
      size: {
        xsmall: "p-2",
        small: "p-3",
        medium: "p-4",
        large: "p-5",
        xlarge: "p-6",
      },
    },
    tabs: {
      size: {
        xsmall: "pt-1 pb-2",
        small: "pt-2 pb-3",
        medium: "pt-2 pb-4",
        large: "pb-5",
        xlarge: "pb-6",
      },
    },
  });
