import { Run } from "@wrkspc/core/run";
import { State } from "enso";
import { useAppState } from "../app/state/Context";
import { useMemoWithProps } from "../utils/hooks";
import { RunManager } from "./Manager";

export namespace TODORunProviderManager {
  export interface Props {
    runAppState: State<Run | undefined>;
    runId: Run.Id | null;
  }

  export interface Wrapper {
    run: Run;
  }
}

export class TODORunProviderManager {
  static use(runId: Run.Id | null) {
    const runAppStateOrNull = useAppState(runId && `runs.${runId}`, () => null);
    const runAppState = State.useEnsure(runAppStateOrNull);

    const runProvider = useMemoWithProps(
      { runAppState, runId },
      (props) => new TODORunProviderManager(props),
      [],
    );

    return runProvider;
  }

  #runAppState;
  #runId;

  constructor(props: TODORunProviderManager.Props) {
    this.#runAppState = props.runAppState;
    this.#runId = props.runId;
  }

  TODO_useRunning() {
    return RunManager.useRunning(this.#runAppState);
  }

  // useComplete() {
  //   return RunManager.useComplete(this.#runAppState);
  // }

  // useMeta() {
  //   return RunManager.useMeta(this.#runAppState);
  // }

  TODO_useRun(): RunManager | undefined {
    return RunManager.TODO_use(this.#runAppState);
  }

  // #createRun(runId: Run.Id) {
  //   const run = buildRunInitialized({
  //     id: runId,
  //   });
  // }

  // clearRun() {
  //   this.#runAppState.set(undefined);
  // }
}
