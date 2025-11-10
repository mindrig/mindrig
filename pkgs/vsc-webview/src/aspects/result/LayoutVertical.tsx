import { Result } from "@wrkspc/core/result";
import { State } from "enso";
import { ResultComponent } from "./Result";
import { ResultsAppState } from "./resultsAppState";

export namespace ResultsLayoutVertical {
  export interface Props {
    discriminatedLayout: State.DiscriminatedVariant<
      ResultsAppState.Layout,
      "type",
      "vertical"
    >;
    resultsState: State<Result[]>;
  }
}

export function ResultsLayoutVertical(props: ResultsLayoutVertical.Props) {
  const { discriminatedLayout } = props;
  const resultsState = props.resultsState.useCollection();
  const solo = resultsState.size === 1;

  return (
    <div className="space-y-3">
      {resultsState.map((resultState, resultIndex) => (
        <div key={resultState.key}>
          <ResultComponent
            resultState={resultState}
            resultIndex={resultIndex}
            discriminatedLayout={discriminatedLayout}
            solo={solo}
          />
        </div>
      ))}
    </div>
  );
}
