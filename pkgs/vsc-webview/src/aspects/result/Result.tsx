import { Result } from "@wrkspc/core/result";
import { Button, Icon, Tag, textCn } from "@wrkspc/ds";
import iconRegularAngleDown from "@wrkspc/icons/svg/regular/angle-down.js";
import iconRegularAngleRight from "@wrkspc/icons/svg/regular/angle-right.js";
import iconRegularLoader from "@wrkspc/icons/svg/regular/loader.js";
import { State } from "enso";
import { LayoutBlock } from "../layout/Block";
import { timeFormatter } from "../util/date";
import { ResultContent } from "./Content";
import { ResultProvider } from "./Context";
import { ResultMeta } from "./Meta";
import { ResultsAppState } from "./resultsAppState";

export { ResultComponent as Result };

export namespace ResultComponent {
  export interface Props {
    resultState: State<Result>;
    resultIndex: number;
    discriminatedLayout: State.Discriminated<ResultsAppState.Layout, "type">;
    solo: boolean;
  }
}

export function ResultComponent(props: ResultComponent.Props) {
  const { resultState, resultIndex, discriminatedLayout, solo } = props;

  const expandedValue = discriminatedLayout.state.useCompute(
    (layout) => "expanded" in layout && !!layout.expanded[resultIndex],
    [resultIndex],
  );
  const expanded =
    solo || discriminatedLayout.discriminator !== "vertical" || expandedValue;

  const createdAt = resultState.$.createdAt.useValue();
  const errored = resultState.useCompute(
    (result) => result.status === "error",
    [],
  );
  const cancelled = resultState.useCompute(
    (result) => result.status === "cancelled",
    [],
  );
  const loading = resultState.useCompute(
    (result) => result.status === "initialized" || result.status === "running",
    [],
  );
  const rowLabel = resultState.$.init.$.datasources.useCompute(
    (datasources) => {
      const dataset = datasources.find((ds) => ds.type === "dataset");
      if (!dataset) return;
      return `row #${dataset.index}`;
    },
    [],
  );
  const modelLabel = resultState.$.init.$.setup.$.ref.useCompute(
    (ref) => `${ref.developerId}/${ref.modelId}`,
    [],
  );

  return (
    <ResultProvider state={resultState}>
      <div className="px-3">
        <LayoutBlock bordered>
          <div className="flex items-center justify-between border-b">
            <div className="flex items-center gap-2">
              {!solo && discriminatedLayout.discriminator === "vertical" && (
                <Button
                  style="label"
                  icon={expanded ? iconRegularAngleDown : iconRegularAngleRight}
                  onClick={() =>
                    discriminatedLayout.state.$.expanded
                      .at(resultIndex)
                      .set(!expandedValue)
                  }
                />
              )}

              <span className="text-sm font-medium">
                {!solo && <span>#{resultIndex + 1}</span>}
              </span>

              <div>
                <span>{modelLabel}</span>
                {rowLabel && (
                  <>
                    {" "}
                    • <span>{rowLabel}</span>
                  </>
                )}
              </div>

              {loading && <Icon id={iconRegularLoader} />}
              {errored && <Tag color="error">Error</Tag>}
              {cancelled && <Tag>Cancelled</Tag>}
            </div>

            <span className={textCn({ size: "xsmall", color: "detail" })}>
              {timeFormatter.format(createdAt)}
            </span>
          </div>

          {expanded && (
            <>
              <ResultMeta resultState={resultState} />

              <ResultContent state={resultState} />
            </>
          )}
        </LayoutBlock>
      </div>
    </ResultProvider>
  );
}
