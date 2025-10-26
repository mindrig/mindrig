export namespace PlaygroundErrors {
  export interface Props {}
}

export function PlaygroundErrors(props: PlaygroundErrors.Props) {
  // TODO: Despaghettify this logic into a meaningful structure
  return (
    gatewayResolved &&
    (showGatewayErrorBanner || showGatewayMissingBanner) && (
      <div
        className={
          showGatewayErrorBanner
            ? "flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:flex-row md:items-center md:justify-between"
            : "flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 md:flex-row md:items-center md:justify-between"
        }
      >
        <div className="space-y-1">
          <div
            className={
              showGatewayErrorBanner
                ? "font-semibold text-red-700"
                : "font-semibold text-amber-700"
            }
          >
            {showGatewayErrorBanner
              ? "Vercel Gateway error"
              : "Vercel Gateway key missing"}
          </div>
          <div
            className={
              showGatewayErrorBanner ? "text-red-600" : "text-amber-700"
            }
          >
            {showGatewayErrorBanner
              ? gatewayErrorMessage
              : "You are not authenticated with Vercel Gateway; LLM requests will fail until you add a key."}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {showGatewayErrorBanner && (
            <button
              onClick={gateway.refresh}
              className="rounded-lg border border-red-500 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
            >
              Retry
            </button>
          )}
          <button
            onClick={() => navigateTo({ type: "auth" })}
            className={
              showGatewayErrorBanner
                ? "rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                : "rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
            }
          >
            {showGatewayErrorBanner ? "Update" : "Add key"}
          </button>
        </div>
      </div>
    )
  );
}
