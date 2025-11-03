import { Result } from "@wrkspc/core/result";

export interface ResultsState {
  layout: ResultsState.Layout;
  results: Result[];
}

export namespace ResultsState {
  export type Layout = LayoutHorizontal | LayoutVertical | LayoutCarousel;

  export interface LayoutHorizontal {
    type: "horizontal";
  }

  export interface LayoutVertical {
    type: "vertical";
    expanded: Record<number, boolean>;
  }

  export interface LayoutCarousel {
    type: "carousel";
    current: number;
  }
}

export function buildResultsState(overrides?: Partial<Result>): ResultsState {
  return {
    layout: buildResultsStateLayoutHorizontal(),
    results: [],
    ...overrides,
  };
}

export function buildResultsStateLayout<
  Type extends ResultsState.Layout["type"],
>(
  type: Type,
  overrides?: Partial<ResultsState.Layout & { type: Type }>,
): ResultsState.Layout {
  switch (type) {
    case "horizontal":
      return buildResultsStateLayoutHorizontal(
        overrides as Partial<ResultsState.LayoutHorizontal>,
      );

    case "vertical":
      return buildResultsStateLayoutVertical(
        overrides as Partial<ResultsState.LayoutVertical>,
      );

    case "carousel":
      return buildResultsStateLayoutCarousel(
        overrides as Partial<ResultsState.LayoutCarousel>,
      );
  }
}

export function buildResultsStateLayoutHorizontal(
  overrides?: Partial<ResultsState.LayoutHorizontal> | undefined,
): ResultsState.LayoutHorizontal {
  return {
    type: "horizontal",
    ...overrides,
  };
}

export function buildResultsStateLayoutVertical(
  overrides?: Partial<ResultsState.LayoutVertical> | undefined,
): ResultsState.LayoutVertical {
  return {
    type: "vertical",
    expanded: {},
    ...overrides,
  };
}

export function buildResultsStateLayoutCarousel(
  overrides?: Partial<ResultsState.LayoutCarousel> | undefined,
): ResultsState.LayoutCarousel {
  return {
    type: "carousel",
    current: 0,
    ...overrides,
  };
}
