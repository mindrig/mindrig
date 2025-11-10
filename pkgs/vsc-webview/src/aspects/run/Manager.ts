import { Result } from "@wrkspc/core/result";
import { Run } from "@wrkspc/core/run";
import { State } from "enso";
import { useMemo } from "react";
import { MessagesContext, useMessages } from "../message/Context";

export namespace RunManager {
  export interface Props {
    runAppState: State<Run>;
    sendMessage: MessagesContext.SendMessage;
  }

  export interface Meta {
    running: boolean;
    complete: boolean;
  }
}

export class RunManager {
  static use(
    runAppState: State<Run> | State<Run | undefined>,
  ): RunManager | undefined {
    const { sendMessage } = useMessages();
    const decomposedRun = runAppState.useDecomposeNullish();

    const manager = useMemo(
      () =>
        decomposedRun.value &&
        new RunManager({ runAppState: decomposedRun.state, sendMessage }),
      [!!decomposedRun.value, sendMessage],
    );

    return manager;
  }

  static running(run: Run | undefined) {
    return run?.status === "initialized" || run?.status === "running";
  }

  static useRunning(runAppState: State<Run> | State<Run | undefined>) {
    return runAppState.useCompute(RunManager.running, []);
  }

  // static complete(run: Run | undefined) {
  //   return run?.status === "complete";
  // }

  // static useComplete(runAppState: State<Run> | State<Run | undefined>) {
  //   return runAppState.useCompute(RunManager.complete, []);
  // }

  // static meta(run: Run | undefined): Run.Meta {
  //   return {
  //     running: RunManager.running(run),
  //     complete: RunManager.running(run),
  //   };
  // }

  // static useMeta(runAppState: State<Run> | State<Run | undefined>): Run.Meta {
  //   return runAppState.useCompute(RunManager.meta, []);
  // }

  #runAppState;
  #sendMessage;

  constructor(props: RunManager.Props) {
    this.#runAppState = props.runAppState;
    this.#sendMessage = props.sendMessage;
  }

  useRunning() {
    return RunManager.useRunning(this.#runAppState);
  }

  stopRun() {
    if (!RunManager.running(this.#runAppState.value)) return;

    this.#sendMessage({
      type: "run-client-stop",
      payload: { runId: this.#runAppState.$.id.value },
    });
  }

  useResultsState(): State<Result[]> | undefined {
    const discriminatedRun = this.#runAppState.useDiscriminate("status");
    switch (discriminatedRun.discriminator) {
      case "initialized":
      case "error":
        return;

      default:
        return discriminatedRun.state.$.results;
    }
  }

  get runId(): Run.Id {
    return this.#runAppState.$.id.value;
  }
}
