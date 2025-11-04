import { Button } from "@wrkspc/ds";
import iconRegularAngleLeft from "@wrkspc/icons/svg/regular/angle-left.js";
import iconRegularAngleRight from "@wrkspc/icons/svg/regular/angle-right.js";
import { State } from "enso";
import { Result } from "./Result";
import { useResults } from "./ResultsContext";
import { ResultsState } from "./state";

export namespace ResultsLayoutCarousel {
  export interface Props {
    discriminatedLayout: State.DiscriminatedVariant<
      ResultsState.Layout,
      "type",
      "carousel"
    >;
  }
}

export function ResultsLayoutCarousel(props: ResultsLayoutCarousel.Props) {
  const { discriminatedLayout } = props;
  const layoutState = discriminatedLayout.state;
  const { state } = useResults();
  const resultsState = state.$.results.useCollection();
  const currentIndex = layoutState.$.current.useValue();
  // TODO: Add opposite of useDefined to Enso. See @ts-expect-error below.
  // Good name option is useUnwrapNullish, but then `Field.useDefined` should be
  // `Field.useWrapNullish`. Alternative is the `useNullish`, but it feels a bit
  // less clear.
  const resultState = resultsState.at(currentIndex);
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

      <Result
        // @ts-expect-error
        state={resultState}
        index={currentIndex}
        discriminatedLayout={discriminatedLayout}
        solo={solo}
      />
    </div>
  );
}
