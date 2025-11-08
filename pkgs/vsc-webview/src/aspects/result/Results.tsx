import { Tabs } from "@wrkspc/ds";
import iconRegularRightLeft from "@wrkspc/icons/svg/regular/right-left.js";
import iconRegularTableColumns from "@wrkspc/icons/svg/regular/table-columns.js";
import iconRegularTableRows from "@wrkspc/icons/svg/regular/table-rows.js";
import { useServerStoreState } from "../server/StoreContext";
import { ResultsLayout } from "./Layout";
import { useResults } from "./ResultsContext";
import { buildResultsStateLayout } from "./state";

export function Results() {
  const { state } = useResults();

  const [, setDefaultLayout] = useServerStoreState(
    "global",
    "playground.results.layout",
  );
  state.$.layout.$.type.useWatch(setDefaultLayout, [setDefaultLayout]);

  const layout = state.$.layout.$.type.useValue();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h5 className="text-sm font-medium">Results</h5>
        </div>

        <Tabs
          initial={layout}
          value={layout}
          onChange={(newLayout) =>
            state.$.layout.set(buildResultsStateLayout(newLayout))
          }
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

      <ResultsLayout />
    </div>
  );
}
