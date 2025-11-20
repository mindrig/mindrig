import { ModelLanguage } from "@wrkspc/core/model";
import { Result, ResultMessage } from "@wrkspc/core/result";
import { buildRunInitialized, Run, RunMessage } from "@wrkspc/core/run";
import { always } from "alwaysly";
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

  static running(run: Run | undefined): boolean {
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
      [`runs.${runId}.results`]: results,
    }));

    this.#runsAppState.$.results.at(runId).set(results);
  }

  #setResult(runId: Run.Id, resultState: State<Result>, nextResult: Result) {
    this.#appStateStore.setStore((store) => {
      const resultKey = `runs.${runId}.results` as const;
      const resultsStoreState = store[resultKey];
      always(resultsStoreState?.results);
      const nextResults = resultsStoreState.results.map((result) =>
        result.id === nextResult.id ? nextResult : result,
      );
      return {
        ...store,
        [resultKey]: nextResults,
      };
    });

    resultState.set(nextResult);
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
    const { runId, patch } = message.payload;
    const runState = this.#runsAppState.$.results.try(runId);
    always(runState);
    const resultState = runState.find((run) => run.id === patch.id);
    always(resultState);

    const { init, createdAt } = resultState.value;
    this.#setResult(runId, resultState, {
      init,
      createdAt,
      ...patch,
    });
  }

  #onResultStream(message: ResultMessage.ServerStream) {
    const { runId, resultId, textChunk } = message.payload;
    const runState = this.#runsAppState.$.results.try(message.payload.runId);
    always(runState);
    const resultState = runState.find((result) => result.id === resultId);
    always(resultState);
    const result = resultState.value;
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

    this.#setResult(runId, resultState, {
      ...result,
      payload: { type: "language", content },
    });
  }

  //#endregion
}
