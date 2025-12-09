import { textCn } from "@wrkspc/ds";
import { Icon } from "@wrkspc/icons";
import iconRegularHourglass from "@wrkspc/icons/svg/regular/hourglass.js";
import { Block } from "@wrkspc/ui";
import { PropsWithChildren } from "react";

export namespace ResultEmpty {
  export interface Props {
    loading?: boolean;
  }
}

export function ResultEmpty(props: PropsWithChildren<ResultEmpty.Props>) {
  const { loading, children } = props;
  return (
    <Block align size="small">
      {loading && (
        <Icon id={iconRegularHourglass} size="small" color="support" />
      )}

      <div className={textCn({ color: "support" })}>{props.children}</div>
    </Block>
  );
}
