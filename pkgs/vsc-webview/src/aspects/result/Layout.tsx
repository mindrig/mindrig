import { never } from "alwaysly";
import { ResultsLayoutCarousel } from "./LayoutCarousel";
import { ResultsLayoutHorizontal } from "./LayoutHorizontal";
import { ResultsLayoutVertical } from "./LayoutVertical";
import { useResults } from "./ResultsContext";

export namespace ResultsLayout {
  export interface Props {}
}

export function ResultsLayout(props: ResultsLayout.Props) {
  const { state } = useResults();
  const discriminatedLayout = state.$.layout.useDiscriminate("type");

  switch (discriminatedLayout.discriminator) {
    case "horizontal":
      return (
        <ResultsLayoutHorizontal discriminatedLayout={discriminatedLayout} />
      );

    case "vertical":
      return (
        <ResultsLayoutVertical discriminatedLayout={discriminatedLayout} />
      );

    case "carousel":
      return (
        <ResultsLayoutCarousel discriminatedLayout={discriminatedLayout} />
      );

    default:
      discriminatedLayout satisfies never;
      never();
  }
}
