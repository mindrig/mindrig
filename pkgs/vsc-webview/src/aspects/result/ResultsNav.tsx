import { Result } from "@wrkspc/core/result";
import iconRegularAngleLeft from "@wrkspc/icons/svg/regular/angle-left.js";
import iconRegularAngleRight from "@wrkspc/icons/svg/regular/angle-right.js";
import { Block, Button } from "@wrkspc/ui";
import { State } from "enso";
import { ResultsAppState } from "./resultsAppState";

export namespace ResultsLayoutCarouselNav {
  export interface Props {
    layoutState: State<ResultsAppState.LayoutCarousel>;
    resultsState: State<Result[]>;
  }
}

export function ResultsLayoutCarouselNav(
  props: ResultsLayoutCarouselNav.Props,
) {
  const { layoutState } = props;
  const currentIndex = layoutState.$.current.useValue();
  const resultsState = props.resultsState.useCollection();

  return (
    <Block size="xsmall" align>
      <Button
        style="label"
        color="secondary"
        icon={iconRegularAngleLeft}
        onClick={() => layoutState.$.current.set(currentIndex - 1)}
        isDisabled={currentIndex === 0}
      />

      <Button
        style="label"
        color="secondary"
        icon={iconRegularAngleRight}
        onClick={() => layoutState.$.current.set(currentIndex + 1)}
        isDisabled={currentIndex === resultsState.size - 1}
      />
    </Block>
  );
}
