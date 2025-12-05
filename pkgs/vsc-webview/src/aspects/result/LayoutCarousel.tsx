import { Result } from "@wrkspc/core/result";
import { Block } from "@wrkspc/ui";
import { State } from "enso";
import { ResultComponent } from "./Result";
import { ResultsAppState } from "./resultsAppState";

export namespace ResultsLayoutCarousel {
  export interface Props {
    discriminatedLayout: State.DiscriminatedVariant<
      ResultsAppState.Layout,
      "type",
      "carousel"
    >;
    resultsState: State<Result[]>;
  }
}

export function ResultsLayoutCarousel(props: ResultsLayoutCarousel.Props) {
  const { discriminatedLayout } = props;
  const layoutState = discriminatedLayout.state;
  const resultsState = props.resultsState.useCollection();
  const currentIndex = layoutState.$.current.useValue();
  // TODO: Add opposite of useDefined to Enso. See @ts-expect-error below.
  // Good name option is useUnwrapNullish, but then `Field.useDefined` should be
  // `Field.useWrapNullish`. Alternative is the `useNullish`, but it feels a bit
  // less clear.
  const resultState = resultsState.at(currentIndex);
  const decomposedResult = resultState.decomposeNullish();
  const solo = resultsState.size === 1;

  return (
    <Block dir="y" pad={{ bottom: "medium" }}>
      {decomposedResult.value ? (
        <ResultComponent
          resultState={decomposedResult.state}
          resultIndex={currentIndex}
          discriminatedLayout={discriminatedLayout}
          solo={solo}
        />
      ) : (
        <div>Result not found</div>
      )}
    </Block>
  );
}
