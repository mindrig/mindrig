import { LayoutSection } from "../layout/Section";
import { ResultsLayout } from "./Layout";
import { useResults } from "./ResultsContext";
import { ResultsLayoutPicker } from "./ResultsLayoutPicker";

export function Results() {
  const { results } = useResults();
  const resultsState = results.useResultsState();

  return (
    <LayoutSection
      header="Results"
      actions={
        resultsState && <ResultsLayoutPicker resultsState={resultsState} />
      }
      horizontalScroll
      style="fill"
    >
      {resultsState ? (
        <ResultsLayout resultsState={resultsState} />
      ) : (
        <div>Loading...</div>
      )}
    </LayoutSection>
  );
}
