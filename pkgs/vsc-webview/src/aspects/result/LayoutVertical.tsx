import { Result } from "@wrkspc/core/result";
import { Block } from "@wrkspc/ui";
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
    <Block dir="y">
      {resultsState.map((resultState, resultIndex) => (
        <ResultComponent
          resultState={resultState}
          resultIndex={resultIndex}
          discriminatedLayout={discriminatedLayout}
          solo={solo}
          key={resultState.key}
        />
      ))}
    </Block>
  );
}
