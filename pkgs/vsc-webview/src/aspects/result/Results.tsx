import { Tabs } from "@wrkspc/ds";
import iconRegularRightLeft from "@wrkspc/icons/svg/regular/right-left.js";
import iconRegularTableColumns from "@wrkspc/icons/svg/regular/table-columns.js";
import iconRegularTableRows from "@wrkspc/icons/svg/regular/table-rows.js";
import { ResultsLayout } from "./Layout";
import { useResults } from "./ResultsContext";

export function Results() {
  const { results } = useResults();
  const layoutType = results.useLayoutType();
  const resultsState = results.useResultsState();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium">Results</h5>

        <Tabs
          initial={layoutType}
          value={layoutType}
          onChange={(newLayout) => results.setLayoutType(newLayout)}
          items={[
            {
              id: "vertical",
              icon: iconRegularTableRows,
              label: "Vertical",
            },
            {
              id: "horizontal",
              icon: iconRegularTableColumns,
              label: "Horizontal",
            },
            {
              id: "carousel",
              icon: iconRegularRightLeft,
              label: "Carousel",
            },
          ]}
          size="small"
          style="inline"
        />
      </div>

      {resultsState ? (
        <ResultsLayout resultsState={resultsState} />
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
