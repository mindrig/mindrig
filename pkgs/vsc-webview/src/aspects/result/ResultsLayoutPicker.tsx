import { Result } from "@wrkspc/core/result";
import { Tabs } from "@wrkspc/ds";
import iconRegularRightLeft from "@wrkspc/icons/svg/regular/right-left.js";
import iconRegularTableColumns from "@wrkspc/icons/svg/regular/table-columns.js";
import iconRegularTableRows from "@wrkspc/icons/svg/regular/table-rows.js";
import { State } from "enso";
import { useResults } from "./ResultsContext";

export namespace ResultsLayoutPicker {
  export interface Props {
    resultsState: State<Result[]>;
  }
}

export function ResultsLayoutPicker(props: ResultsLayoutPicker.Props) {
  const { resultsState } = props;
  const { results } = useResults();
  const layoutType = results.useLayoutType();
  const multi = resultsState.useCompute((results) => results.length > 1, []);

  if (!multi) return null;

  return (
    <Tabs
      initial={layoutType}
      label="Layout:"
      value={layoutType}
      onChange={(newLayout) => results.setLayoutType(newLayout)}
      items={[
        {
          id: "horizontal",
          icon: iconRegularTableColumns,
        },
        {
          id: "vertical",
          icon: iconRegularTableRows,
        },
        {
          id: "carousel",
          icon: iconRegularRightLeft,
        },
      ]}
      size="xsmall"
      style="inline"
    />
  );
}
