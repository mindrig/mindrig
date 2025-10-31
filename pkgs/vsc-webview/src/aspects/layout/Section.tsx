import { Size } from "@wrkspc/ds";
import { cn } from "crab";

export namespace LayoutSection {
  export interface Props extends cn.Props<typeof layoutSectionCn> {}
}

export function LayoutSection(
  props: React.PropsWithChildren<LayoutSection.Props>,
) {
  return <section className={layoutSectionCn(props)}>{props.children}</section>;
}

export const layoutSectionCn = cn<{
  bordered: boolean;
  pinned: boolean;
  size: Size;
  top: boolean;
}>()
  .base("px-[20px] flex flex-col gap-3")
  .top(false)
  .size("medium", {
    xsmall: [
      "gap-1",
      {
        top: {
          true: "pb-1",
          false: "py-1",
        },
      },
    ],
    small: [
      "gap-2",
      {
        top: {
          true: "pb-1",
          false: "py-1",
        },
      },
    ],
    medium: [
      "gap-3",
      {
        top: {
          true: "pb-2",
          false: "py-2",
        },
      },
    ],
    large: [
      "gap-4",
      {
        top: {
          true: "pb-3",
          false: "py-3",
        },
      },
    ],
    xlarge: [
      "gap-5",
      {
        top: {
          true: "pb-3",
          false: "py-3",
        },
      },
    ],
  })
  .bordered(false, {
    true: [
      "border-b",
      [{ pinned: true }, "border-section-border-pinned"],
      [{ pinned: false }, "border-section-border"],
    ],
    false: "",
  })
  .pinned(false);
