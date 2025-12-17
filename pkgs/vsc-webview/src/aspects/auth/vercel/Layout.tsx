import { useApp } from "@/aspects/app/Context";
import { LayoutSection } from "@/aspects/layout/Section";
import { Icon } from "@wrkspc/ds";
import iconRegularTimes from "@wrkspc/icons/svg/regular/times.js";
import { PropsWithChildren } from "react";

export function AuthVercelLayout(props: PropsWithChildren) {
  const { navigateTo } = useApp();

  return (
    <LayoutSection
      header="Vercel Gateway"
      actions={
        <Icon
          id={iconRegularTimes}
          size="small"
          color="support"
          onClick={() => navigateTo({ type: "playground" })}
        />
      }
      grow
    >
      {props.children}
    </LayoutSection>
  );
}
