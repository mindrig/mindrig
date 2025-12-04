import { textCn } from "@wrkspc/ds";
import { RunManager } from "../run/Manager";

export namespace TestRunStarted {
  export interface Props {
    run: RunManager;
  }
}

export function TestRunStarted(props: TestRunStarted.Props) {
  const { run } = props;
  const runningTime = run.useRunningTimeSec();

  return (
    <div className="flex items-center gap-3">
      <span className={textCn({ size: "small", color: "detail" })}>
        {runningTime}s
      </span>
    </div>
  );
}
