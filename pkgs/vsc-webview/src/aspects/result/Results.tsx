import { LayoutInner } from "../layout/Inner";
import { ResultsLayout } from "./Layout";
import { useResults } from "./ResultsContext";
import { ResultsLayoutPicker } from "./ResultsLayoutPicker";

export function Results() {
  const { results } = useResults();
  const resultsState = results.useResultsState();

  return (
    <div>
      {resultsState ? (
        <>
          <LayoutInner pad="x">
            <ResultsLayoutPicker resultsState={resultsState} />
          </LayoutInner>

          <ResultsLayout resultsState={resultsState} />
        </>
      ) : (
        <div>Loading...</div>
      )}

      {/* <LayoutSection
      header="Results"
      actions={
        resultsState && <ResultsLayoutPicker resultsState={resultsState} />
      }
      horizontalScroll
      style="fill"
    > */}
      {/* </LayoutSection> */}
    </div>
  );
}
