import { Icon, textCn } from "@wrkspc/ds";
import { Block } from "@wrkspc/ui";
import React from "react";

export namespace PageEmpty {
  export interface Props {
    icon: Icon.Prop;
    label: string;
    description: string;
    actions?: React.ReactNode | undefined;
    notices?: React.ReactNode | undefined;
  }
}

export function PageEmpty(props: PageEmpty.Props) {
  const { icon, label, description, actions, notices } = props;

  return (
    <Block dir="y" gap={false}>
      {notices}

      <Block dir="y" pad={[false, "medium", "medium"]}>
        <Block dir="y" size="small" align pad={["xlarge", "large"]} border>
          <Icon id={icon} size="xlarge" color="support" />

          <Block dir="y" size="xsmall">
            <h2
              className={textCn({
                role: "label",
                align: "center",
                size: "large",
              })}
            >
              {label}
            </h2>

            <p
              className={textCn({
                color: "support",
                align: "center",
                className: "max-w-sm text-balance",
              })}
            >
              {description}
            </p>
          </Block>

          <Block size="small" align>
            {actions}
          </Block>
        </Block>
      </Block>
    </Block>
  );
}
