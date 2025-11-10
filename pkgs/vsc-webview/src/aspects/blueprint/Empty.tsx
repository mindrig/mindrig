import { useEffect } from "react";
import { log } from "smollog";

export function BlueprintEmpty() {
  useEffect(() => {
    log.debug("No prompt selected");
  }, []);

  return <div>No prompt selected.</div>;
}
