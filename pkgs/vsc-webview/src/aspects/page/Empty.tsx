import { Icon, textCn } from "@wrkspc/ds";
import { Block } from "@wrkspc/ui";

export namespace PageEmpty {
  export interface Props {
    icon: Icon.Prop;
    label: string;
    description: string;
  }
}

export function PageEmpty(props: PageEmpty.Props) {
  const { icon, label, description } = props;
  return (
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
      </Block>
    </Block>
  );
}
