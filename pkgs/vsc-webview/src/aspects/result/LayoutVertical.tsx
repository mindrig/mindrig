import { State } from "enso";
import { Result } from "./Result";
import { useResults } from "./ResultsContext";
import { ResultsState } from "./state";

export namespace ResultsLayoutVertical {
  export interface Props {
    discriminatedLayout: State.DiscriminatedVariant<
      ResultsState.Layout,
      "type",
      "vertical"
    >;
  }
}

export function ResultsLayoutVertical(props: ResultsLayoutVertical.Props) {
  const { discriminatedLayout } = props;
  const { state } = useResults();
  const resultsState = state.$.results.useCollection();
  const solo = resultsState.size === 1;

  return (
    <div className="space-y-3">
      {resultsState.map((result, index) => (
        <div key={result.key}>
          <Result
            state={result}
            index={index}
            discriminatedLayout={discriminatedLayout}
            solo={solo}
          />
        </div>
      ))}
    </div>
  );
}
