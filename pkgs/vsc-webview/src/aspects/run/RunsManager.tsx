import { ModelLanguage } from "@wrkspc/core/model";
import { Result, ResultMessage } from "@wrkspc/core/result";
import {
  buildRunId,
  buildRunInitialized,
  Run,
  RunMessage,
} from "@wrkspc/core/run";
import { always } from "alwaysly";
import { State } from "enso";
import { useMemo } from "react";
import { log } from "smollog";
import { useAppState } from "../app/state/Context";
import { AppState } from "../app/state/state";
import {
  MessagesContext,
  useListenMessage,
  useMessages,
} from "../message/Context";
import {
  buildResultsAppState,
  ResultsAppState,
} from "../result/resultsAppState";
import { useMemoWithProps } from "../util/hooks";
import { RunManager } from "./Manager";
import { buildRunAppState } from "./appState";

export namespace RunsManager {
  export interface Props {
    appState: State<AppState>;
    sendMessage: MessagesContext.SendMessage;
  }
}

export class RunsManager {
  static use() {
    const { appState } = useAppState();
    const { sendMessage } = useMessages();

    const runs = useMemoWithProps(
      { appState, sendMessage },
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

  #appState;
  #sendMessage;

  constructor(props: RunsManager.Props) {
    this.#appState = props.appState;
    this.#sendMessage = props.sendMessage;
  }

  startRun(init: Run.Init): Run.Id {
    const runId = buildRunId();
    log.debug("Starting run", runId, init);

    const run = buildRunInitialized({ id: runId, init });
    this.#setRun(runId, run);

    this.#sendMessage({
      type: "run-client-start",
      payload: run,
    });

    return runId;
  }

  #setRun(runId: Run.Id, run: Run | undefined) {
    const runAppState = this.#appState.$.runs.at(runId);
    if (run) runAppState.pave(buildRunAppState(run)).$.run.set(run);
    else runAppState.set(undefined);
  }

  #setResults(runId: Run.Id, results: Result[]) {
    this.resultsAppState(runId).$.results.set(results);
  }

  useRunning(runId: Run.Id | null) {
    return this.#appState.$.runs.useCompute(
      (runs) => !!runId && RunsManager.running(runs[runId]?.run),
      [runId],
    );
  }

  useRun(runId: Run.Id | null): RunManager | null {
    // TODO: Make Enso accept falsy keys, so then we can ensure hooks
    // consistency.
    const decomposedRun = this.#appState.$.runs
      .at(runId || ("nope" as any))
      .useDecomposeNullish();

    const run = useMemo(
      () =>
        (decomposedRun.value &&
          new RunManager({
            runAppState: decomposedRun.state,
            sendMessage: this.#sendMessage,
          })) ||
        null,
      [this, decomposedRun.value?.run.id],
    );

    return run;
  }

  clearRun(runId: Run.Id) {
    log.debug("Clearing run", runId);
    // TODO: There's a fundamental issue with Enso discriminate and decompose.
    // Until it is resolved, changing it to undefined will break run & co
    // managers and ultimately app. To save time, we're disabling it here, but
    // we must solve it so the store doesn't grow with each run.
    // this.#setRun(runId, undefined);
  }

  resultsAppState(runId: Run.Id): State<ResultsAppState> {
    return this.#appState.$.results.at(runId).pave(buildResultsAppState());
  }

  #cancelRunningTasks(runId: Run.Id) {
    log.debug("Cancelling running tasks for run", runId);

    this.#appState.$.results.try(runId)?.$.results.forEach?.((resultState) => {
      const result = resultState.value;
      if (result.status !== "running" && result.status !== "initialized")
        return;

      const { id, init, createdAt } = result;
      const { startedAt, payload } = result.status === "running" ? result : {};
      resultState.set({
        id,
        init,
        status: "cancelled",
        createdAt,
        endedAt: Date.now(),
        startedAt,
        payload: payload || null,
      });
    });
  }

  //#region Events

  #onRunUpdate(message: RunMessage.ServerUpdate) {
    const runState = this.#appState.$.runs.at(message.payload.id)?.$?.run;
    const run = runState?.value;
    always(run);

    // If run was cancelled, cancel any running tasks too.
    if (message.payload.status === "cancelled")
      this.#cancelRunningTasks(run.id);

    const { id, init, createdAt } = run;
    this.#setRun(id, {
      init,
      createdAt,
      ...message.payload,
    });
  }

  #onResultsInit(message: RunMessage.ServerResultsInit) {
    const { runId, results } = message.payload;
    log.debug("Got results init for run", runId, results);
    this.#setResults(runId, results);
  }

  #onResultUpdate(message: ResultMessage.ServerUpdate) {
    const { runId, patch } = message.payload;
    log.debug("Got result update", runId, patch);
    const resultState = this.#result(runId, patch.id);

    const { init, createdAt } = resultState.value;
    resultState.set({ init, createdAt, ...patch });
  }

  #onResultStream(message: ResultMessage.ServerStream) {
    const { runId, resultId, textChunk } = message.payload;
    log.debug("Got result stream", runId, resultId, textChunk);
    const resultState = this.#result(runId, resultId);

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

    resultState.set({
      ...result,
      payload: { type: "language", content },
    });
  }

  #result(runId: Run.Id, resultId: Result.Id) {
    const resultState = this.#appState.$.results
      .try(runId)
      ?.$.results?.find?.((result) => result.value.id === resultId);
    always(resultState);
    return resultState;
  }

  //#endregion
}
