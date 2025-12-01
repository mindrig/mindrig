import { Button } from "@wrkspc/ds";
import { RunManager } from "../run/Manager";

export namespace TestRunStarted {
  export interface Props {
    run: RunManager;
    running: boolean;
  }
}

export function TestRunStarted(props: TestRunStarted.Props) {
  const { run, running } = props;
  const runningTime = run.useRunningTimeSec();

  return (
    <div className="flex items-center gap-2">
      {running && (
        <Button style="transparent" size="small" onClick={() => run.stopRun()}>
          Stop
        </Button>
      )}

      <div>{runningTime}s</div>
    </div>
  );
}
