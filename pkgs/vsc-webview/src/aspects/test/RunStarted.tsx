import iconRegularTrashAlt from "@wrkspc/icons/svg/regular/trash-alt.js";
import { Block, Button } from "@wrkspc/ui";
import { RunManager } from "../run/Manager";
import { RunningTime } from "../ui/RunningTime";
import { useTest } from "./Context";

export namespace TestRunStarted {
  export interface Props {
    run: RunManager;
  }
}

export function TestRunStarted(props: TestRunStarted.Props) {
  const { run } = props;
  const runningTimeSec = run.useRunningTimeSec();
  const running = run.useRunning();
  const { test } = useTest();

  return (
    <Block size="small" align>
      <Button
        style="label"
        size="xsmall"
        color="secondary"
        icon={iconRegularTrashAlt}
        onClick={() => test.clearRun()}
        isDisabled={running}
      >
        Clear
      </Button>

      <RunningTime runningTimeSec={runningTimeSec} ended={!running} />
    </Block>
  );
}
