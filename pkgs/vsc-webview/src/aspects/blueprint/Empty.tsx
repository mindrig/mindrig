import { Icon, textCn } from "@wrkspc/ds";
import iconRegularHandPointer from "@wrkspc/icons/svg/regular/hand-pointer.js";
import { Block } from "@wrkspc/ui";
import { useEffect } from "react";
import { log } from "smollog";

export function BlueprintEmpty() {
  useEffect(() => {
    log.debug("No prompt selected");
  }, []);

  return (
    <Block dir="y" pad={[false, "medium", "medium"]}>
      <Block dir="y" size="small" align pad={["xlarge", "large"]} border>
        <Icon id={iconRegularHandPointer} size="xlarge" color="support" />

        <h2 className={textCn({ role: "label", size: "large" })}>
          No prompt selected
        </h2>

        <p className={textCn({ color: "support" })}>
          Focus a prompt in the source code to test it.
        </p>
      </Block>
    </Block>
  );
}
