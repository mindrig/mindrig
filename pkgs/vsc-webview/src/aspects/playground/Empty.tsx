import iconRegularDoNotEnter from "@wrkspc/icons/svg/regular/do-not-enter.js";
import { PageEmpty } from "../page/Empty";
import { PlaygroundNotices } from "./Notices";

export function PlaygroundEmpty() {
  return (
    <PageEmpty
      notices={<PlaygroundNotices />}
      icon={iconRegularDoNotEnter}
      label="No supported file open"
      description="Only text files are supported by the playground."
    />
  );
}
