import { buildRunInitialized, Run, RunMessage } from "@wrkspc/core/run";
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
import { Result, ResultMessage } from "@wrkspc/core/result";
import { always } from "alwaysly";

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

    // Run

    useListenMessage(
      "run-server-update",
      (message) => runs.#onRunUpdate(message),
      [runs],
    );

    // Results

    useListenMessage(
      "run-server-results-init",
      (message) => runs.#onResultsInit(message),
      [runs],
    );

    useListenMessage(
      "result-server-update",
      (message) => runs.#onResultUpdate(message),
      [runs],
    );

    useListenMessage(
      "result-server-stream",
      (message) => runs.#onResultStream(message),
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

  #setResults(runId: Run.Id, results: Result[]) {
    this.#appStateStore.setStore((store) => ({
      ...store,
      [`results.${runId}`]: results,
    }));

    this.#runsAppState.$.results.at(runId).set(results);
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

  //#region Events

  #onRunUpdate(message: RunMessage.ServerUpdate) {
    const runState = this.#runsAppState.$.runs.at(message.payload.id);
    const run = runState.value;
    always(run);
    const { id, init, createdAt } = run;
    this.#setRun(id, {
      init,
      createdAt,
      ...message.payload,
    });
  }

  #onResultsInit(message: RunMessage.ServerResultsInit) {
    this.#setResults(message.payload.runId, message.payload.results);
  }

  #onResultUpdate(message: ResultMessage.ServerUpdate) {
    const resultState = this.#runsAppState.$.results.at(message.payload.id);
    const result = resultState.value;
    always(result);
    const { id, init, createdAt } = result;
    this.#setResult(id, {
      init,
      createdAt,
      ...message.payload,
    });
  }

  #onResultStream(message: ResultMessage.ServerStream) {
    const runState = this.#runsAppState.$.results.try(message.payload.runId);
    always(runState);
    const resultState = runState.at(message.payload.resultId);
    const result = runState.value;
    // TODO: Show an error instead?
    always(result.status === "running");
    const prevContent = result.payload?.content;

    const parts =
      prevContent?.type === "text-parts"
        ? prevContent.parts
        : prevContent?.type === "text"
          ? [prevContent.text]
          : [];

    const content: ModelLanguage.Content = {
      type: "text-parts",
      parts: [...parts, textChunk],
    };

    runState.set({
      ...result,
      payload: { type: "language", content },
    });
  }

  //#endregion
}
