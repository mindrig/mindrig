import { cn } from "crab";

export namespace PanelSection {
  export interface Props extends cn.Props<typeof panelSectionCn> {
    bordered?: boolean;
  }
}

export function PanelSection(
  props: React.PropsWithChildren<PanelSection.Props>,
) {
  return <section className={panelSectionCn(props)}>{props.children}</section>;
}

export const panelSectionCn = cn<{ bordered: boolean }>()
  .base("px-[20px] flex flex-col gap-3")
  .bordered(false, {
    true: "border-b border-section-border pb-2",
    false: "",
  });
