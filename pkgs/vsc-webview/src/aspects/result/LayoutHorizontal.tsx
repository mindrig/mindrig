import { Result } from "@wrkspc/core/result";
import { State } from "enso";
import { ResultComponent } from "./Result";
import { ResultsAppState } from "./resultsAppState";

export namespace ResultsLayoutHorizontal {
  export interface Props {
    discriminatedLayout: State.DiscriminatedVariant<
      ResultsAppState.Layout,
      "type",
      "horizontal"
    >;
    resultsState: State<Result[]>;
  }
}

export function ResultsLayoutHorizontal(props: ResultsLayoutHorizontal.Props) {
  const { discriminatedLayout } = props;
  const resultsState = props.resultsState.useCollection();
  const solo = resultsState.size === 1;

  return (
    <div
      className="grow grid gap-3 overflow-x-auto"
      style={{ gridTemplateColumns: `repeat(${resultsState.size}, 100%)` }}
    >
      {resultsState.map((resultState, index) => (
        <ResultComponent
          resultState={resultState}
          resultIndex={index}
          discriminatedLayout={discriminatedLayout}
          solo={solo}
          key={resultState.key}
        />
      ))}
    </div>
  );
}
