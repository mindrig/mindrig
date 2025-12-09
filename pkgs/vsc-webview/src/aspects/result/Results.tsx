import { Result } from "@wrkspc/core/result";
import { Icon, textCn } from "@wrkspc/ds";
import iconRegularHourglass from "@wrkspc/icons/svg/regular/hourglass.js";
import { Block, Tag } from "@wrkspc/ui";
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

  if (!resultsState && !running) return null;

  if (resultsState)
    return (
      <Block dir="y" gap={false} grow>
        <Block
          size="small"
          pad={["small", "medium", "small"]}
          justify="between"
        >
          <Block size="small" align>
            <Block size="xsmall" align>
              <h3 className={textCn({ role: "label" })}>
                {resultsState.size === 1 ? "Result" : "Results"}
              </h3>

              {resultsState.size > 1 && (
                <Tag size="small">{resultsState.size}</Tag>
              )}
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

            {/* <Button
              style="label"
              size="xsmall"
              color="secondary"
              icon={iconRegularTrashAlt}
              onClick={clearRun}
              isDisabled={running}
            >
              Clear
            </Button> */}
          </Block>
        </Block>

        <ResultsLayout
          resultsState={resultsState}
          discriminatedLayout={discriminatedLayout}
        />
      </Block>
    );

  return (
    <div>
      <Block pad="medium" align size="small">
        <Icon id={iconRegularHourglass} size="small" color="support" />
        <div className={textCn({ color: "support" })}>
          Waiting for initial data...
        </div>
      </Block>
    </div>
  );
}

namespace Content {
  export interface Props {
    resultsState: State<Result[]>;
  }
}

function Content(props: Content.Props) {}
