import { RunManager } from "../run/Manager";
import { RunningTime } from "../ui/RunningTime";

export namespace TestRunStarted {
  export interface Props {
    run: RunManager;
  }
}

export function TestRunStarted(props: TestRunStarted.Props) {
  const { run } = props;
  const runningTime = run.useRunningTimeSec();
  const running = run.useRunning();

  return <RunningTime runningTimeSec={runningTime} ended={!running} />;
}
