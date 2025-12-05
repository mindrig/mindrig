import { textCn } from "@wrkspc/ds";
import { Block } from "@wrkspc/ui";
import { PropsWithChildren } from "react";

export function ResultMetaEmpty(props: PropsWithChildren) {
  return (
    <Block border={[false, true, true]} pad>
      <p className={textCn({ size: "small", color: "support" })}>
        {props.children}
      </p>
    </Block>
  );
}
