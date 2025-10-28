export interface ResultProps {
  // index: number;
  // result: RunResult;
  // isVerticalLayout: boolean;
  // collapsed: boolean;
  // timestamp?: number;
  // isLoading: boolean;
  // showFailureBadge: boolean;
  // modelEntry: AvailableModel | null;
  // modelSettingsCollapsed: boolean;
  // onToggleCollapse: (index: number) => void;
  // onToggleModelSettings: (index: number) => void;
  // requestExpanded: boolean;
  // onToggleRequest: (index: number) => void;
  // responseExpanded: boolean;
  // onToggleResponse: (index: number) => void;
  // view: "rendered" | "raw";
  // onChangeView: (index: number, view: "rendered" | "raw") => void;
}

export function PromptRunResult(props: ResultProps) {
  // const {
  //   index,
  //   result,
  //   isVerticalLayout,
  //   collapsed,
  //   timestamp,
  //   isLoading,
  //   showFailureBadge,
  //   modelEntry,
  //   modelSettingsCollapsed,
  //   onToggleCollapse,
  //   onToggleModelSettings,
  //   requestExpanded,
  //   onToggleRequest,
  //   responseExpanded,
  //   onToggleResponse,
  //   view,
  //   onChangeView,
  // } = props;

  // const headerTitle =
  //   result.label ||
  //   [result.model?.label ?? result.model?.id, result.runLabel]
  //     .filter(Boolean)
  //     .join(" • ") ||
  //   `Result ${index + 1}`;

  // const modelSettingsPayload = result.model?.settings
  //   ? {
  //       id: result.model.id,
  //       provider: result.model.providerId,
  //       options: result.model.settings.options,
  //       reasoning: result.model.settings.reasoning,
  //       providerOptions: result.model.settings.providerOptions,
  //       tools: result.model.settings.tools,
  //       attachments: result.model.settings.attachments,
  //     }
  //   : null;

  // const handleToggleCollapse = () => onToggleCollapse(index);
  // const handleToggleModelSettings = () => onToggleModelSettings(index);
  // const handleToggleRequest = () => onToggleRequest(index);
  // const handleToggleResponse = () => onToggleResponse(index);
  // const handleViewChange = (next: "rendered" | "raw") =>
  //   onChangeView(index, next);

  return (
    <div className="border rounded">
      {/* <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          {isVerticalLayout && (
            <button
              className="px-2 py-1 border rounded text-xs"
              onClick={handleToggleCollapse}
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? "+" : "-"}
            </button>
          )}
          <span className="text-sm font-medium">{headerTitle}</span>
          {showFailureBadge && <span className="text-xs">Failed</span>}
        </div>

        {timestamp && (
          <span className="text-xs">
            {new Date(timestamp).toLocaleString()}
          </span>
        )}
      </div> */}

      {/* {!collapsed && (
        <div className="p-3 space-y-3">
          {isLoading && !result.error && (
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span
                aria-hidden
                className="inline-flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"
              />
              <span>
                {result.streaming === false
                  ? "Waiting for result…"
                  : "Streaming…"}
              </span>
            </div>
          )}

          {result.nonStreamingNote && (
            <div className="text-xs text-neutral-500">
              {result.nonStreamingNote}
            </div>
          )}

          {result.error && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Error</h5>
              <div className="p-3 rounded border">
                <pre className="text-sm whitespace-pre-wrap">
                  {result.error}
                </pre>
              </div>
            </div>
          )}

          <ResultSettings
            settings={modelSettingsPayload}
            collapsed={modelSettingsCollapsed}
            onToggle={handleToggleModelSettings}
          />

          <ResultRequest
            request={result.request ?? null}
            expanded={requestExpanded}
            onToggle={handleToggleRequest}
          />

          <ResultMessages
            result={result}
            isLoading={isLoading}
            view={view}
            onViewChange={handleViewChange}
          />

          <ResultResponse
            response={result.response ?? null}
            expanded={responseExpanded}
            onToggle={handleToggleResponse}
          />

          <PricingInfo usage={result.usage} modelEntry={modelEntry} />
        </div>
      )} */}
    </div>
  );
}
