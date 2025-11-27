import { Icon, textCn } from "@wrkspc/ds";
import { cn } from "crab";
import React from "react";

export namespace LayoutSection {
  export interface Props extends cn.Props<typeof layoutSectionCn> {
    header?: string | undefined;
    actions?: React.ReactNode | undefined;
    icon?: Icon.Prop | undefined;
  }

  export type Style = "header" | "tabs" | "default";

  export type Sticky = "top" | "bottom" | false;
}

export function LayoutSection(
  props: React.PropsWithChildren<LayoutSection.Props>,
) {
  const { header, actions, icon, children } = props;

  const hasChildren =
    !!children && (!Array.isArray(children) || children.length > 0);

  const cns = layoutSectionCn(props);

  return (
    <section className={cns.wrapper}>
      {header && (
        <div className={cn(cns.block, cns.header)}>
          <h3
            className={textCn({
              role: "subheader",
              size: "xsmall",
              className: "flex gap-1 items-center",
              uppercase: true,
            })}
          >
            {icon && <Icon id={icon} size="small" color="detail" />}
            <span className="leading-none">{header}</span>
          </h3>

          <div className="flex gap-2 items-center">{actions}</div>
        </div>
      )}

      {hasChildren && (
        <div className={cn(cns.block, cns.content)}>{children}</div>
      )}
    </section>
  );
}

export const layoutSectionCn = cn().group(($) => ({
  wrapper: $<{
    sticky: LayoutSection.Sticky;
  }>()
    .base(
      "flex flex-col bg-section-header-canvas border-b border-section-border last:border-0",
    )
    .sticky(false, {
      top: "sticky top-0 z-10",
      bottom:
        "sticky bottom-0 z-10 before:content-[''] before:block before:h-[1px] before:top-[-1px] before:w-full before:absolute before:bg-section-border",
    }),

  block: $.base("px-3"),

  header: $.base(
    "py-2 flex gap-2 items-center justify-between bg-section-header-canvas",
  ),

  content: $<{
    divided: boolean;
    style: LayoutSection.Style;
  }>()
    .base("flex flex-col gap-3")
    .divided(false, {
      true: "divide-y divide-divider",
    })
    .style("default", {
      default: "pt-3 pb-4",
      tabs: "pb-4",
      header: "pb-2",
    }),
}));
