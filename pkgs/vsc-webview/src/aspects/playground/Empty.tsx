import iconRegularDoNotEnter from "@wrkspc/icons/svg/regular/do-not-enter.js";
import { PageEmpty } from "../page/Empty";

export function PlaygroundEmpty() {
  return (
    <PageEmpty
      icon={iconRegularDoNotEnter}
      label="No supported file open"
      description="At the moment only JavaScript, TypeScripty and Python files are supported."
    />
  );
}
