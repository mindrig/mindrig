import { Result } from "@wrkspc/core/result";
import { Run } from "@wrkspc/core/run";

export interface ResultsAppState {
  layout: ResultsAppState.Layout;
}

export namespace ResultsAppState {
  export type Store = {
    [Key in `runs.${Run.Id}.results`]: ResultsAppState;
  };

  export type Layout = LayoutHorizontal | LayoutVertical | LayoutCarousel;

  export type LayoutType = Layout["type"];

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

export function buildResultsAppState(
  overrides?: Partial<Result>,
): ResultsAppState {
  return {
    layout: buildResultsAppStateLayoutHorizontal(),
    ...overrides,
  };
}

export function buildResultsAppStateLayout<
  Type extends ResultsAppState.LayoutType,
>(
  type: Type,
  overrides?: Partial<ResultsAppState.Layout & { type: Type }>,
): ResultsAppState.Layout {
  switch (type) {
    case "horizontal":
      return buildResultsAppStateLayoutHorizontal(
        overrides as Partial<ResultsAppState.LayoutHorizontal>,
      );

    case "vertical":
      return buildResultsAppStateLayoutVertical(
        overrides as Partial<ResultsAppState.LayoutVertical>,
      );

    case "carousel":
      return buildResultsAppStateLayoutCarousel(
        overrides as Partial<ResultsAppState.LayoutCarousel>,
      );
  }
}

export function buildResultsAppStateLayoutHorizontal(
  overrides?: Partial<ResultsAppState.LayoutHorizontal> | undefined,
): ResultsAppState.LayoutHorizontal {
  return {
    type: "horizontal",
    ...overrides,
  };
}

export function buildResultsAppStateLayoutVertical(
  overrides?: Partial<ResultsAppState.LayoutVertical> | undefined,
): ResultsAppState.LayoutVertical {
  return {
    type: "vertical",
    expanded: {},
    ...overrides,
  };
}

export function buildResultsAppStateLayoutCarousel(
  overrides?: Partial<ResultsAppState.LayoutCarousel> | undefined,
): ResultsAppState.LayoutCarousel {
  return {
    type: "carousel",
    current: 0,
    ...overrides,
  };
}
