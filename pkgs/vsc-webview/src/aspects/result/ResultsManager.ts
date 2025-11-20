import { Result } from "@wrkspc/core/result";
import { Run } from "@wrkspc/core/run";
import { todo } from "alwaysly";
import { State } from "enso";
import { useAppState } from "../app/state/Context";
import { useRuns } from "../run/RunsContext";
import { useStorePropState } from "../store/Context";
import { useMemoWithProps } from "../utils/hooks";
import {
  buildResultsAppState,
  buildResultsAppStateLayout,
  ResultsAppState,
} from "./resultsAppState";

export namespace ResultsManager {
  export interface Props {
    resultsState: State<Result[]>;
    resultsAppState: State<ResultsAppState>;
  }
}

export class ResultsManager {
  static use(runId: Run.Id): ResultsManager | null {
    const { runs } = useRuns();
    const resultsState = runs.useResults(runId);
    todo(
      "Problem here is that useAppState is used both in RunsManager and ResultsManager, and each has its own state instance rewriting the other.",
    );
    const resultsAppState = useAppState(
      `runs.${runId}.results`,
      buildResultsAppState,
    );

    const results = useMemoWithProps(
      { resultsState, resultsAppState },
      ({ resultsState, ...props }) =>
        resultsState && new ResultsManager({ resultsState, ...props }),
      [],
    );

    return results;
  }

  #resultsState: State<Result[]>;
  #resultsAppState: State<ResultsAppState>;

  constructor(props: ResultsManager.Props) {
    this.#resultsState = props.resultsState;
    this.#resultsAppState = props.resultsAppState;
  }

  useLayoutType() {
    const defaultLayoutStoreState = useStorePropState(
      "global",
      "playground.results.layout",
    );
    this.#resultsAppState.$.layout.$.type.useWatch(
      (type) => defaultLayoutStoreState.set(type),
      [defaultLayoutStoreState],
    );
    const layout = this.#resultsAppState.$.layout.$.type.useValue();
    return layout;
  }

  setLayoutType(type: ResultsAppState.LayoutType) {
    this.#resultsAppState.$.layout.set(buildResultsAppStateLayout(type));
  }

  useDiscriminatedLayout() {
    return this.#resultsAppState.$.layout.useDiscriminate("type");
  }

  useResultsState() {
    const decomposedResults = this.#resultsState.useDecomposeNullish();
    return decomposedResults.value && decomposedResults.state;
  }
}
