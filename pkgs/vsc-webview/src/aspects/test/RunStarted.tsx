import { textCn } from "@wrkspc/ds";
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
      <span className={textCn({ size: "small", color: "detail" })}>
        {runningTime}s
      </span>
    </div>
  );
}
