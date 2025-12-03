import { Result } from "@wrkspc/core/result";
import { textCn } from "@wrkspc/ds";
import iconRegularTrashAlt from "@wrkspc/icons/svg/regular/trash-alt.js";
import { Block, Button, Tag } from "@wrkspc/ui";
import { State } from "enso";
import { useRun } from "../run/Context";
import { ResultsLayout } from "./Layout";
import { useResults } from "./ResultsContext";
import { ResultsLayoutPicker } from "./ResultsLayoutPicker";
import { ResultsLayoutCarouselNav } from "./ResultsNav";

export namespace Results {
  export interface Props {
    clearRun: () => void;
  }
}

export function Results(props: Results.Props) {
  const { clearRun } = props;
  const { run } = useRun();
  const running = run.useRunning();
  const { results } = useResults();
  const resultsState = results.useResultsState();
  const discriminatedLayout = results.useDiscriminatedLayout();

  return (
    <>
      {resultsState ? (
        <Block dir="y" grow gap={false}>
          <Block
            size="small"
            pad={["small", "medium", false]}
            justify="between"
          >
            <Block size="small" align>
              <Block size="xsmall" align>
                <h3 className={textCn({ role: "label" })}>Results</h3>

                <Tag size="small">{resultsState.size}</Tag>
              </Block>

              {discriminatedLayout.discriminator === "carousel" && (
                <ResultsLayoutCarouselNav
                  layoutState={discriminatedLayout.state}
                  resultsState={resultsState}
                />
              )}
            </Block>

            <Block align>
              <ResultsLayoutPicker resultsState={resultsState} />

              <Button
                style="label"
                size="xsmall"
                color="secondary"
                icon={iconRegularTrashAlt}
                onClick={clearRun}
                isDisabled={running}
              >
                Clear
              </Button>
            </Block>
          </Block>

          <ResultsLayout
            resultsState={resultsState}
            discriminatedLayout={discriminatedLayout}
          />
        </Block>
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
    </>
  );
}

namespace Content {
  export interface Props {
    resultsState: State<Result[]>;
  }
}

function Content(props: Content.Props) {}
