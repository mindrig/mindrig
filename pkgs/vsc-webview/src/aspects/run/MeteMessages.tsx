import { Errors } from "@wrkspc/ui";
import { RunManager } from "./Manager";

export namespace MeteMessages {
  export interface Props {
    run: RunManager;
  }
}

export function RunMeteMessages(props: MeteMessages.Props) {
  const { run } = props;
  const { error } = run.useMeta();
  if (!error) return null;
  return <Errors style="notice" errors={error} />;
}
