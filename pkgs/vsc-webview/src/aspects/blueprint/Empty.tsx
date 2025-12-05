import iconRegularHandPointer from "@wrkspc/icons/svg/regular/hand-pointer.js";
import { PageEmpty } from "../page/Empty";

export function BlueprintEmpty() {
  return (
    <PageEmpty
      icon={iconRegularHandPointer}
      label="No prompt selected"
      description="Focus a prompt in the source code to test it."
    />
  );
}
