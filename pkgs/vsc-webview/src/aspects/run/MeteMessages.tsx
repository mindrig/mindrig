import { Run } from "@wrkspc/core/run";
import { Button, Notice } from "@wrkspc/ui";
import { pageHrefs } from "../page/route";
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
  return (
    <Notice color="error" actions={<MessageActions error={error} />}>
      {error.message}
    </Notice>
  );
}

namespace MessageActions {
  export interface Props {
    error: Run.RunError;
  }
}

function MessageActions(props: MessageActions.Props) {
  const { error } = props;

  switch (error.type) {
    case "unauthenticated":
      return (
        <Button size="xsmall" href={pageHrefs.auth()}>
          Set Up
        </Button>
      );
    default:
      return null;
  }
}
