import { Run } from "@wrkspc/core/run";
import { State } from "enso";
import { useRuns } from "../run/RunsContext";
import { useStorePropState } from "../store/Context";
import { useMemoWithProps } from "../utils/hooks";
import { buildResultsAppStateLayout, ResultsAppState } from "./resultsAppState";

export namespace ResultsManager {
  export interface Props {
    resultsAppState: State<ResultsAppState>;
  }
}

export class ResultsManager {
  static use(runId: Run.Id): ResultsManager {
    const { runs } = useRuns();
    const resultsAppState = runs.resultsAppState(runId);

    const results = useMemoWithProps(
      { resultsAppState },
      (props) => new ResultsManager(props),
      [],
    );
    return results;
  }

  #resultsAppState: State<ResultsAppState>;

  constructor(props: ResultsManager.Props) {
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
    const decomposedResults =
      this.#resultsAppState.$.results.useDecomposeNullish();
    return decomposedResults.value && decomposedResults.state;
  }
}
