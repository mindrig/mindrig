import { Button, Size, translateSize } from "@wrkspc/ds";
import iconRegularTimes from "@wrkspc/icons/svg/regular/times.js";
import { cnss } from "cnss";

export namespace LayoutBlock {
  export interface Props extends cnss.Props<typeof layoutBlockCn> {
    header?: React.ReactNode | undefined;
    onClose?: (() => void) | undefined;
  }

  export type Style = "default" | "tabs";
}

export function LayoutBlock(props: React.PropsWithChildren<LayoutBlock.Props>) {
  const { header, size, onClose, children } = props;
  const cns = layoutBlockCn(props);

  return (
    <section className={cns.wrapper}>
      {header && <div>{header}</div>}

      {onClose && (
        <div className={cns.close}>
          <Button
            size={translateSize(size, -1)}
            style="label"
            color="secondary"
            icon={iconRegularTimes}
            onClick={onClose}
          />
        </div>
      )}

      <div className={cns.content}>{children}</div>
    </section>
  );
}

export const layoutBlockCn = cnss().group(($) => ({
  wrapper: $<{
    bordered: boolean;
  }>()
    .base("flex flex-col bg-block-canvas relative")
    .bordered(false, {
      true: "border border-block-border bg-block-canvas",
    }),

  close: $<{ size: Size }>().base("absolute top-2 right-2").size("medium", {
    xsmall: "top-1 right-1",
    small: "top-1 right-1",
    medium: "top-2 right-2",
    large: "top-3 right-3",
    xlarge: "top-4 right-4",
  }),

  content: $<{
    size: Size;
    style: LayoutBlock.Style;
    divided: boolean;
  }>()
    .base("flex flex-col gap-3")
    .size("medium", {
      xsmall: "gap-2 px-2",
      small: "gap-3 px-3",
      medium: "gap-4 px-4",
      large: "gap-5 px-5",
      xlarge: "gap-6 px-6",
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
    })
    .divided(false, {
      true: "divide-y divide-divider",
    }),
}));
