import { ModelLanguage } from "@wrkspc/core/model";
import { Result, ResultMessage } from "@wrkspc/core/result";
import { Run } from "@wrkspc/core/run";
import { State } from "enso";
import { useAppState } from "../app/state/Context";
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

    return results;
  }

  #resultsAppState;

  constructor(props: ResultsManager.Props) {
    this.#resultsAppState = props.resultsAppState;
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
}
