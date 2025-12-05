import { Result } from "@wrkspc/core/result";
import { Block } from "@wrkspc/ds";
import { State } from "enso";
import { ResultContent } from "./Content";
import { ResultProvider } from "./Context";
import { ResultHeader } from "./Header";
import { ResultMeta } from "./Meta";
import { ResultsAppState } from "./resultsAppState";

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

  return (
    <ResultProvider resultState={resultState}>
      <Block dir="y" pad="x">
        <Block dir="y" gap={false} border>
          {!solo && (
            <ResultHeader
              resultIndex={resultIndex}
              expanded={
                !solo &&
                discriminatedLayout.discriminator === "vertical" && {
                  value: expanded,
                  set(next: boolean) {
                    discriminatedLayout.state.$.expanded
                      .at(resultIndex)
                      .set(next);
                  },
                }
              }
              solo={solo}
            />
          )}

          {expanded && (
            <Block dir="y" gap={false} divided>
              <ResultMeta resultState={resultState} />

              <Block dir="y" pad={["small", "medium", "medium"]} background>
                <ResultContent state={resultState} />
              </Block>
            </Block>
          )}
        </Block>
      </Block>
    </ResultProvider>
  );
}
