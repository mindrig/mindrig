import { State } from "enso";
import { Result } from "./Result";
import { useResults } from "./ResultsContext";
import { ResultsState } from "./state";

export namespace ResultsLayoutHorizontal {
  export interface Props {
    discriminatedLayout: State.DiscriminatedVariant<
      ResultsState.Layout,
      "type",
      "horizontal"
    >;
  }
}

export function ResultsLayoutHorizontal(props: ResultsLayoutHorizontal.Props) {
  const { discriminatedLayout } = props;
  const { state } = useResults();
  const resultsState = state.$.results.useCollection();
  const solo = resultsState.size === 1;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {resultsState.map((result, index) => (
        <div className="min-w-[360px] max-w-[480px] shrink-0" key={result.key}>
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
