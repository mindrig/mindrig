import { Button } from "@wrkspc/ds";
import iconRegularBroomWide from "@wrkspc/icons/svg/regular/broom-wide.js";
import { RunManager } from "../run/Manager";
import { useTest } from "./Context";

export namespace TestRunStarted {
  export interface Props {
    run: RunManager;
  }
}

export function TestRunStarted(props: TestRunStarted.Props) {
  const { run } = props;
  const runningTime = run.useRunningTimeSec();
  const { test } = useTest();
  const running = test.useRunning();

  return (
    <div className="flex items-center gap-3">
      <Button
        style="label"
        size="xsmall"
        color="secondary"
        icon={iconRegularBroomWide}
        onClick={() => test.clearRun()}
        isDisabled={running}
      >
        Clear
      </Button>

      <div>{runningTime}s</div>
    </div>
  );
}
