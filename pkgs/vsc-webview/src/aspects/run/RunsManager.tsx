import { ModelLanguage } from "@wrkspc/core/model";
import { Result, ResultMessage } from "@wrkspc/core/result";
import { buildRunInitialized, Run, RunMessage } from "@wrkspc/core/run";
import { always } from "alwaysly";
import { State } from "enso";
import { nanoid } from "nanoid";
import { useMemo } from "react";
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
import { useMemoWithProps } from "../utils/hooks";
import { RunManager } from "./Manager";

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
    this.#appState.$.runs.at(runId).set(run);
  }

  #setResults(runId: Run.Id, results: Result[]) {
    this.resultsAppState(runId).$.results.set(results);
  }

  useRunning(runId: Run.Id | null) {
    return this.#appState.$.runs.useCompute(
      (runs) => !!runId && RunsManager.running(runs[runId]),
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

  resultsAppState(runId: Run.Id): State<ResultsAppState> {
    return this.#appState.$.results.at(runId).pave(buildResultsAppState());
  }

  //#region Events

  #onRunUpdate(message: RunMessage.ServerUpdate) {
    const runState = this.#appState.$.runs.at(message.payload.id);
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
    const resultState = this.#result(runId, patch.id);

    const { init, createdAt } = resultState.value;
    resultState.set({ init, createdAt, ...patch });
  }

  #onResultStream(message: ResultMessage.ServerStream) {
    const { runId, resultId, textChunk } = message.payload;
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
