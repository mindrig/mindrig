import { Tabs } from "@wrkspc/ds";
import iconRegularRightLeft from "@wrkspc/icons/svg/regular/right-left.js";
import iconRegularTableColumns from "@wrkspc/icons/svg/regular/table-columns.js";
import iconRegularTableRows from "@wrkspc/icons/svg/regular/table-rows.js";
import { useResults } from "./ResultsContext";

export function ResultsLayoutPicker() {
  const { results } = useResults();
  const layoutType = results.useLayoutType();

  return (
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
  );
}
