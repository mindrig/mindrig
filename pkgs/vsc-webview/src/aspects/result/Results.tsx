import { Block } from "@wrkspc/ui";
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
          <Block size="small" pad>
            {/* <LayoutInner pad="x"> */}
            <ResultsLayoutPicker resultsState={resultsState} />
            {/* </LayoutInner> */}
          </Block>

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
