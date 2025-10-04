import { useAssessmentResultsContext } from "@/aspects/assessment/hooks/useAssessmentResultsView";
import type { RunResult } from "@/aspects/assessment/types";

import { Result } from "./Result";

export function Results() {
  const {
    results,
    models,
    timestamp,
    layout,
    onLayoutChange,
    collapsedResults,
    onToggleCollapse,
    collapsedModelSettings,
    onToggleModelSettings,
    requestExpanded,
    onToggleRequest,
    responseExpanded,
    onToggleResponse,
    viewTabs,
    onChangeView,
    activeResultIndex,
    onActiveResultIndexChange,
  } = useAssessmentResultsContext();

  if (!results.length) return null;

  const renderResult = (result: RunResult, index: number) => {
    const isLoading = Boolean(result.isLoading);
    const showFailureBadge = !isLoading && result.success === false;
    const isVerticalLayout = layout === "vertical";
    const collapsed = isVerticalLayout ? !!collapsedResults[index] : false;
    const modelEntry = result.model?.id
      ? models.find((model) => model.id === result.model?.id) || null
      : null;

    return (
      <Result
        key={index}
        index={index}
        result={result}
        isVerticalLayout={isVerticalLayout}
        collapsed={collapsed}
        timestamp={timestamp}
        isLoading={isLoading}
        showFailureBadge={showFailureBadge}
        modelEntry={modelEntry}
        modelSettingsCollapsed={collapsedModelSettings[index] ?? true}
        onToggleCollapse={onToggleCollapse}
        onToggleModelSettings={onToggleModelSettings}
        requestExpanded={requestExpanded[index] ?? false}
        onToggleRequest={onToggleRequest}
        responseExpanded={responseExpanded[index] ?? false}
        onToggleResponse={onToggleResponse}
        view={viewTabs[index] ?? "rendered"}
        onChangeView={onChangeView}
      />
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium">Results</h5>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onLayoutChange("vertical")}
            className={`px-2 py-1 text-xs font-medium rounded border ${layout === "vertical" ? "font-semibold" : ""}`}
          >
            Vertical
          </button>
          <button
            type="button"
            onClick={() => onLayoutChange("horizontal")}
            className={`px-2 py-1 text-xs font-medium rounded border ${layout === "horizontal" ? "font-semibold" : ""}`}
          >
            Horizontal
          </button>
          <button
            type="button"
            onClick={() => onLayoutChange("carousel")}
            className={`px-2 py-1 text-xs font-medium rounded border ${layout === "carousel" ? "font-semibold" : ""}`}
          >
            Carousel
          </button>
        </div>
      </div>

      {layout === "horizontal" && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {results.map((result, index) => (
            <div key={index} className="min-w-[360px] max-w-[480px] flex-shrink-0">
              {renderResult(result, index)}
            </div>
          ))}
        </div>
      )}

      {layout === "vertical" && (
        <div className="space-y-3">
          {results.map((result, index) => (
            <div key={index}>{renderResult(result, index)}</div>
          ))}
        </div>
      )}

      {layout === "carousel" && results.length > 0 && (
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
      )}
    </div>
  );
}
