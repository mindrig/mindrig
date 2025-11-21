import { ResultsLayout } from "./Layout";
import { useResults } from "./ResultsContext";
import { ResultsLayoutPicker } from "./ResultsLayoutPicker";

export function Results() {
  const { results } = useResults();
  const resultsState = results.useResultsState();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium">Results</h5>

        {resultsState && <ResultsLayoutPicker resultsState={resultsState} />}
      </div>

      {resultsState ? (
        <ResultsLayout resultsState={resultsState} />
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
