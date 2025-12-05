import { textCn } from "@wrkspc/ds";
import { Block } from "@wrkspc/ui";
import { PropsWithChildren } from "react";

export function ResultMetaEmpty(props: PropsWithChildren) {
  return (
    <Block border pad>
      <p className={textCn({ size: "small", color: "support" })}>
        {props.children}
      </p>
    </Block>
  );
}
