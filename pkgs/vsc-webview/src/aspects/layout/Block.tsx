import { Size } from "@wrkspc/ds";
import { cn } from "crab";

export namespace LayoutBlock {
  export interface Props extends cn.Props<typeof layoutBlockCn> {}

  export type Style = "bordered" | "colored";
}

export function LayoutBlock(props: React.PropsWithChildren<LayoutBlock.Props>) {
  return <section className={layoutBlockCn(props)}>{props.children}</section>;
}

export const layoutBlockCn = cn<{
  size: Size;
  bordered: boolean;
}>()
  .base("flex flex-col bg-block-canvas")
  .size("medium", {
    xsmall: "gap-2 p-2",
    small: "gap-3 p-3",
    medium: "gap-4 p-4",
    large: "gap-5 p-5",
    xlarge: "gap-6 p-6",
  })
  .bordered(false, {
    true: "border border-block-border bg-block-canvas",
  });
