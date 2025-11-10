import { Result } from "@wrkspc/core/result";
import { Button } from "@wrkspc/ds";
import iconRegularAngleLeft from "@wrkspc/icons/svg/regular/angle-left.js";
import iconRegularAngleRight from "@wrkspc/icons/svg/regular/angle-right.js";
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs">
          Result {currentIndex + 1} of {resultsState.size}
        </span>

        <div className="flex items-center gap-2">
          <Button
            style="label"
            icon={iconRegularAngleLeft}
            onClick={() => layoutState.$.current.set(currentIndex - 1)}
            isDisabled={currentIndex === 0}
          />

          <Button
            style="label"
            icon={iconRegularAngleRight}
            onClick={() => layoutState.$.current.set(currentIndex + 1)}
            isDisabled={currentIndex === resultsState.size - 1}
          />
        </div>
      </div>

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
    </div>
  );
}
