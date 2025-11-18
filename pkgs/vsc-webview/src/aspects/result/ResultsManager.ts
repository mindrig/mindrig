import { ModelLanguage } from "@wrkspc/core/model";
import { Result, ResultMessage } from "@wrkspc/core/result";
import { Run } from "@wrkspc/core/run";
import { always } from "alwaysly";
import { State } from "enso";
import { useAppState } from "../app/state/Context";
import { useListenMessage } from "../message/Context";
import { useStoreProp } from "../store/Context";
import { useMemoWithProps } from "../utils/hooks";
import {
  buildResultsAppState,
  buildResultsAppStateLayout,
  ResultsAppState,
} from "./resultsAppState";

export namespace ResultsManager {
  export interface Props {
    resultsAppState: State<ResultsAppState>;
  }
}

export class ResultsManager {
  static use(runId: Run.Id): ResultsManager {
    const resultsAppState = useAppState(
      `runs.${runId}.results`,
      buildResultsAppState,
    );

    const results = useMemoWithProps(
      { resultsAppState },
      (props) => new ResultsManager(props),
      [],
    );

    useListenMessage(
      "run-server-results-init",
      (message) => {
        if (message.payload.runId !== runId) return;
        results.#init(message.payload.results);
      },
      [results],
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
      [results],
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
      [results],
    );

    return results;
  }

  #resultsAppState;

  constructor(props: ResultsManager.Props) {
    this.#resultsAppState = props.resultsAppState;
  }

  #init(results: Result.Initialized[]) {
    this.#resultsAppState.$.results.set(results);
  }

  #update(
    resultState: State<Result>,
    update: ResultMessage.ServerUpdatePayload,
  ) {
    const { init, createdAt } = resultState.value;
    resultState.set({ init, createdAt, ...update });
  }

  #stream(resultState: State<Result>, textChunk: string) {
    const result = resultState.value;
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

    resultState.set({
      ...result,
      payload: { type: "language", content },
    });
  }

  useLayoutType() {
    const [, setDefaultLayout] = useStoreProp(
      "global",
      "playground.results.layout",
    );
    this.#resultsAppState.$.layout.$.type.useWatch(setDefaultLayout, [
      setDefaultLayout,
    ]);
    const layout = this.#resultsAppState.$.layout.$.type.useValue();
    return layout;
  }

  setLayoutType(type: ResultsAppState.LayoutType) {
    this.#resultsAppState.$.layout.set(buildResultsAppStateLayout(type));
  }

  useDiscriminatedLayout() {
    return this.#resultsAppState.$.layout.useDiscriminate("type");
  }

  useResultsState(): State<Result[]> | null {
    const decomposedResults =
      this.#resultsAppState.$.results.useDecomposeNullish();
    if (!decomposedResults.value) return null;
    return decomposedResults.state;
  }
}
