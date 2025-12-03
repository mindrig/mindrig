import { Result } from "@wrkspc/core/result";
import { never } from "alwaysly";
import { State } from "enso";
import { ResultsLayoutCarousel } from "./LayoutCarousel";
import { ResultsLayoutHorizontal } from "./LayoutHorizontal";
import { ResultsLayoutVertical } from "./LayoutVertical";
import { ResultsAppState } from "./resultsAppState";

export namespace ResultsLayout {
  export interface Props {
    resultsState: State<Result[]>;
    discriminatedLayout: State.Discriminated<ResultsAppState.Layout, "type">;
  }
}

export function ResultsLayout(props: ResultsLayout.Props) {
  const { resultsState, discriminatedLayout } = props;

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
