import { Result } from "@wrkspc/core/result";
import { never } from "alwaysly";
import { State } from "enso";
import { ResultsLayoutCarousel } from "./LayoutCarousel";
import { ResultsLayoutHorizontal } from "./LayoutHorizontal";
import { ResultsLayoutVertical } from "./LayoutVertical";
import { useResults } from "./ResultsContext";

export namespace ResultsLayout {
  export interface Props {
    resultsState: State<Result[]>;
  }
}

export function ResultsLayout(props: ResultsLayout.Props) {
  const { resultsState } = props;
  const { results } = useResults();
  const discriminatedLayout = results.useDiscriminatedLayout();

  switch (discriminatedLayout.discriminator) {
    case "horizontal":
      return (
        <ResultsLayoutHorizontal
          discriminatedLayout={discriminatedLayout}
          resultsState={resultsState}
        />
      );

    case "vertical":
      return (
        <ResultsLayoutVertical
          discriminatedLayout={discriminatedLayout}
          resultsState={resultsState}
        />
      );

    case "carousel":
      return (
        <ResultsLayoutCarousel
          discriminatedLayout={discriminatedLayout}
          resultsState={resultsState}
        />
      );

    default:
      discriminatedLayout satisfies never;
      never();
  }
}
