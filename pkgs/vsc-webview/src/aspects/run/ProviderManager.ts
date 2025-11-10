import { Run } from "@wrkspc/core/run";
import { State } from "enso";
import { useAppState } from "../app/state/Context";
import { useMemoWithProps } from "../utils/hooks";
import { RunManager } from "./Manager";

export namespace RunProviderManager {
  export interface Props {
    runAppState: State<Run | undefined>;
  }

  export interface Wrapper {
    run: Run;
  }
}

export class RunProviderManager {
  static use(runId: Run.Id | null) {
    const runAppStateOrNull = useAppState(runId && `runs.${runId}`, () => null);
    const runAppState = State.useEnsure(runAppStateOrNull);

    const runProvider = useMemoWithProps(
      { runAppState },
      (props) => new RunProviderManager(props),
      [],
    );

    return runProvider;
  }

  #runAppState;

  constructor(props: RunProviderManager.Props) {
    this.#runAppState = props.runAppState;
  }

  useRunning() {
    return RunManager.useRunning(this.#runAppState);
  }

  // useComplete() {
  //   return RunManager.useComplete(this.#runAppState);
  // }

  // useMeta() {
  //   return RunManager.useMeta(this.#runAppState);
  // }

  useRun(): RunManager | undefined {
    return RunManager.use(this.#runAppState);
  }

  clearRun() {
    this.#runAppState.set(undefined);
  }
}
