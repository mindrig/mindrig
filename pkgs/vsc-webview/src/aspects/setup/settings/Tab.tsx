import { Block, Description } from "@wrkspc/ui";
import { PropsWithChildren } from "react";

export namespace SetupSettingsTab {
  export interface Props {
    description: string;
  }
}

export function SetupSettingsTab(
  props: PropsWithChildren<SetupSettingsTab.Props>,
) {
  const { description, children } = props;
  return (
    <Block dir="y" pad={["small", "medium"]} background border>
      <Description>{description}</Description>

      {children}
    </Block>
  );
}
