import { Button, Icon, textCn } from "@wrkspc/ds";
import iconRegularChevronDown from "@wrkspc/icons/svg/regular/chevron-down.js";
import iconRegularChevronRight from "@wrkspc/icons/svg/regular/chevron-right.js";
import { cnss } from "cnss";
import React, { useState } from "react";

export namespace LayoutSection {
  export interface Props extends cnss.Props<typeof layoutSectionCn> {
    header?: HeaderFn | string | undefined;
    actions?: React.ReactNode | undefined;
    icon?: Icon.Prop | undefined;
    collapsible?: boolean | undefined;
    expanded?:
      | [boolean, React.Dispatch<React.SetStateAction<boolean>>]
      | undefined;
  }

  export type HeaderFn = (expanded: boolean) => React.ReactNode;

  export type Style = "default" | "header" | "tabs" | "fill";

  export type Sticky = "top" | "bottom" | false;
}

export function LayoutSection(
  props: React.PropsWithChildren<LayoutSection.Props>,
) {
  const { header, actions, icon, collapsible, children } = props;
  const expandedState = useState(true);
  const [expanded, setExpanded] = props.expanded || expandedState;

  const hasChildren =
    !!children && (!Array.isArray(children) || children.length > 0);

  const cns = layoutSectionCn(props);

  return (
    <section className={cns.wrapper}>
      {header && (
        <div className={cns.header}>
          <h3
            className={textCn({
              role: "subheader",
              size: "xsmall",
              className: "flex gap-1 items-center",
              transform: "uppercase",
            })}
          >
            <span className="shrink-0">
              {collapsible && (
                <Button
                  icon={
                    expanded ? iconRegularChevronDown : iconRegularChevronRight
                  }
                  size="small"
                  style="label"
                  onClick={() => setExpanded(!expanded)}
                />
              )}
            </span>

            {icon && <Icon id={icon} size="small" color="detail" />}

            <span className="leading-none">
              {typeof header === "function" ? header(expanded) : header}
            </span>
          </h3>

          <div className="flex gap-2 items-center shrink-0">{actions}</div>
        </div>
      )}

      {hasChildren && expanded && <div className={cns.content}>{children}</div>}
    </section>
  );
}

export const layoutSectionCn = cnss().group(($) => ({
  wrapper: $<{
    sticky: LayoutSection.Sticky;
    grow: boolean;
  }>()
    .base(
      "flex flex-col bg-section-canvas border-b border-section-border last:border-0",
    )
    .sticky(false, {
      top: "sticky top-0 z-10",
      bottom: [
        "sticky bottom-0 z-10 before:bg-section-border before:content-[''] before:block before:h-[1px] before:top-[-1px] before:w-full before:absolute",
      ],
    })
    .grow(false, { true: "grow" }),

  header: $.base(
    "px-3 h-6 flex gap-2 items-center justify-between bg-section-header-canvas",
  ),

  content: $<{
    divided: boolean;
    style: LayoutSection.Style;
    horizontalScroll: boolean;
    grow: boolean;
  }>()
    .base("flex flex-col ")
    .divided(false, {
      true: "divide-y divide-divider",
    })
    .style("default", {
      default: "gap-3 px-3 pt-3 pb-4",
      tabs: "gap-3 px-3 pt-1 pb-4",
      header: "gap-3 px-3 pb-2",
      fill: "",
    })
    .horizontalScroll(false, { true: "overflow-x-auto" })
    .grow(false, { true: "grow" }),
}));
