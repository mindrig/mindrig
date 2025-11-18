import { buildRunInitialized, Run } from "@wrkspc/core/run";
import { State } from "enso";
import { nanoid } from "nanoid";
import { useMemo } from "react";
import {
  AppStateStoreContext,
  useAppStateStore,
} from "../app/StateStoreContext";
import {
  MessagesContext,
  useListenMessage,
  useMessages,
} from "../message/Context";
import { useMemoWithProps } from "../utils/hooks";
import { RunManager } from "./Manager";
import { buildRunsAppState, RunsAppState } from "./runsAppState";

export namespace RunsManager {
  export interface Props {
    runsAppState: State<RunsAppState>;
    appStateStore: AppStateStoreContext.Value;
    sendMessage: MessagesContext.SendMessage;
  }
}

export class RunsManager {
  static use() {
    const appStateStore = useAppStateStore();
    const { sendMessage } = useMessages();
    const runsAppState = State.use<RunsAppState>(buildRunsAppState(), []);

    const runs = useMemoWithProps(
      { runsAppState, appStateStore, sendMessage },
      (props) => new RunsManager(props),
      [],
    );

    useListenMessage(
      "run-server-results-init",
      (message) => {
        if (message.payload.runId !== runId) return;
        results.#init(message.payload.results);
      },
      [runs],
    );

    useListenMessage(
      "result-server-update",
      (message) => {
        const resultState = resultsAppState.$.results.find?.(
          (result) => result.$.id.value === message.payload.id,
        );
        if (!resultState) return;
        results.#update(resultState, message.payload);
      },
      [runs],
    );

    useListenMessage(
      "result-server-stream",
      (message) => {
        const resultState = resultsAppState.$.results.find?.(
          (result) => result.$.id.value === message.payload.resultId,
        );
        if (!resultState) return;
        results.#stream(resultState, message.payload.textChunk);
      },
      [runs],
    );

    useListenMessage(
      "run-server-update",
      (message) => {
        if (!run || message.payload.id !== run.runId) return;
        // message.payload.id
        // if (message.payload.id !== runAppState.$.id.value) return;
        // // runAppState.set(message.payload.run);
      },
      [runs],
    );

    return runs;
  }

  static running(run: Run | undefined) {
    return run?.status === "initialized" || run?.status === "running";
  }

  #runsAppState;
  #appStateStore;
  #sendMessage;

  constructor(props: RunsManager.Props) {
    this.#runsAppState = props.runsAppState;
    this.#appStateStore = props.appStateStore;
    this.#sendMessage = props.sendMessage;
  }

  startRun(init: Run.Init): Run.Id {
    const runId: Run.Id = nanoid();

    const run = buildRunInitialized({ id: runId, init });
    this.#setRun(runId, run);

    this.#sendMessage({
      type: "run-client-start",
      payload: run,
    });

    return runId;
  }

  #setRun(runId: Run.Id, run: Run | undefined) {
    this.#appStateStore.setStore((store) => ({
      ...store,
      [`runs.${runId}`]: run,
    }));

    this.#runsAppState.$.runs.at(runId).set(run);
  }

  useRunning(runId: Run.Id | null) {
    return this.#runsAppState.$.runs.useCompute(
      (runs) => !!runId && RunsManager.running(runs[runId]),
      [runId],
    );
  }

  useRun(runId: Run.Id | null): RunManager | null {
    // TODO: Make Enso accept falsy keys, so then we can ensure hooks
    // consistency.
    const decomposedRun = this.#runsAppState.$.runs
      .at(runId || ("nope" as any))
      .useDecomposeNullish();

    const run = useMemo(
      () =>
        (decomposedRun.value &&
          new RunManager({
            runState: decomposedRun.state,
            sendMessage: this.#sendMessage,
          })) ||
        null,
      [!!decomposedRun.value],
    );

    return run;
  }

  clearRun(runId: Run.Id) {
    this.#setRun(runId, undefined);
  }
}
