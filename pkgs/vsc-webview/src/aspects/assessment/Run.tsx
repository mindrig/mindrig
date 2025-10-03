export interface AssessmentRunProps {
  canRunPrompt: boolean;
  runInFlight: boolean;
  isStopping: boolean;
  showStopButton: boolean;
  stopDisabled: boolean;
  streamingEnabled: boolean;
  streamingToggleId: string;
  hasResultsOrError: boolean;
  onExecute: () => void;
  onStop: () => void;
  onClear: () => void;
  onStreamingToggle: (enabled: boolean) => void;
}

export function AssessmentRun(props: AssessmentRunProps) {
  const {
    canRunPrompt,
    runInFlight,
    isStopping,
    showStopButton,
    stopDisabled,
    streamingEnabled,
    streamingToggleId,
    hasResultsOrError,
    onExecute,
    onStop,
    onClear,
    onStreamingToggle,
  } = props;

  const runLabel = isStopping
    ? "Stopping…"
    : runInFlight
      ? "Running..."
      : "Run Prompt";
  const stopLabel = isStopping ? "Stopping…" : "Stop";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={onExecute}
          disabled={runInFlight || !canRunPrompt}
          className="px-4 py-2 border text-sm font-medium rounded disabled:opacity-60"
        >
          {runLabel}
        </button>

        {showStopButton && (
          <button
            type="button"
            onClick={onStop}
            disabled={stopDisabled}
            className="px-3 py-2 border text-sm font-medium rounded disabled:opacity-60"
          >
            {stopLabel}
          </button>
        )}
      </div>

      <label
        htmlFor={streamingToggleId}
        className="flex items-center gap-2 text-sm"
      >
        <input
          id={streamingToggleId}
          type="checkbox"
          className="h-4 w-4"
          checked={streamingEnabled}
          disabled={runInFlight}
          onChange={(event) => onStreamingToggle(event.target.checked)}
        />
        Stream output
      </label>

      {hasResultsOrError && (
        <button
          onClick={onClear}
          disabled={runInFlight}
          className="px-4 py-2 border text-sm font-medium rounded disabled:opacity-60"
        >
          Clear
        </button>
      )}
    </div>
  );
}
