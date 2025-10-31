import { Tabs } from "@wrkspc/ds";
import iconRegularRightLeft from "@wrkspc/icons/svg/regular/right-left.js";
import iconRegularTableColumns from "@wrkspc/icons/svg/regular/table-columns.js";
import iconRegularTableRows from "@wrkspc/icons/svg/regular/table-rows.js";

export function RunResults() {
  // const {
  //   results,
  //   models,
  //   timestamp,
  //   layout,
  //   onLayoutChange,
  //   collapsedResults,
  //   onToggleCollapse,
  //   collapsedModelSettings,
  //   onToggleModelSettings,
  //   requestExpanded,
  //   onToggleRequest,
  //   responseExpanded,
  //   onToggleResponse,
  //   viewTabs,
  //   onChangeView,
  //   activeResultIndex,
  //   onActiveResultIndexChange,
  // } = useAssessmentResultsContext();

  // if (!results.length) return null;

  // const renderResult = (result: RunResult, index: number) => {
  //   const isLoading = Boolean(result.isLoading);
  //   const showFailureBadge = !isLoading && result.success === false;
  //   const isVerticalLayout = layout === "vertical";
  //   const collapsed = isVerticalLayout ? !!collapsedResults[index] : false;
  //   const modelEntry = result.model?.id
  //     ? models.find((model) => model.id === result.model?.id) || null
  //     : null;

  //   return (
  //     <PromptRunResult
  //       key={index}
  //       index={index}
  //       result={result}
  //       isVerticalLayout={isVerticalLayout}
  //       collapsed={collapsed}
  //       timestamp={timestamp}
  //       isLoading={isLoading}
  //       showFailureBadge={showFailureBadge}
  //       modelEntry={modelEntry}
  //       modelSettingsCollapsed={collapsedModelSettings[index] ?? true}
  //       onToggleCollapse={onToggleCollapse}
  //       onToggleModelSettings={onToggleModelSettings}
  //       requestExpanded={requestExpanded[index] ?? false}
  //       onToggleRequest={onToggleRequest}
  //       responseExpanded={responseExpanded[index] ?? false}
  //       onToggleResponse={onToggleResponse}
  //       view={viewTabs[index] ?? "rendered"}
  //       onChangeView={onChangeView}
  //     />
  //   );
  // };

  const tab = "vertical";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium">Results</h5>

        <Tabs
          initial={tab}
          value={tab}
          onChange={(newTab) => {
            // onLayoutChange("horizontal")
          }}
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

      {/* {layout === "horizontal" && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {results.map((result, index) => (
            <div
              key={index}
              className="min-w-[360px] max-w-[480px] flex-shrink-0"
            >
              {renderResult(result, index)}
            </div>
          ))}
        </div>
      )} */}

      {/* {layout === "vertical" && (
        <div className="space-y-3">
          {results.map((result, index) => (
            <div key={index}>{renderResult(result, index)}</div>
          ))}
        </div>
      )} */}

      {/* {layout === "carousel" && results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs">
              Result {activeResultIndex + 1} of {results.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onActiveResultIndexChange(Math.max(activeResultIndex - 1, 0))
                }
                disabled={activeResultIndex === 0}
                className="h-7 w-7 inline-flex items-center justify-center border rounded disabled:opacity-50"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={() =>
                  onActiveResultIndexChange(
                    Math.min(activeResultIndex + 1, results.length - 1),
                  )
                }
                disabled={activeResultIndex === results.length - 1}
                className="h-7 w-7 inline-flex items-center justify-center border rounded disabled:opacity-50"
              >
                ▶
              </button>
            </div>
          </div>
          {renderResult(results[activeResultIndex]!, activeResultIndex)}
        </div>
      )} */}
    </div>
  );
}
