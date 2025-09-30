import { cn } from "crab";

export namespace PanelSection {
  export interface Props extends cn.Props<typeof panelSectionCn> {}
}

export function PanelSection(
  props: React.PropsWithChildren<PanelSection.Props>,
) {
  return <section className={panelSectionCn(props)}>{props.children}</section>;
}

export const panelSectionCn = cn<{ bordered: boolean; pinned: boolean }>()
  .base("px-[20px] flex flex-col gap-3")
  .bordered(false, {
    true: [
      "border-b pb-2",
      [{ pinned: true }, "border-section-border-pinned"],
      [{ pinned: false }, "border-section-border"],
    ],
    false: "",
  })
  .pinned(false);
