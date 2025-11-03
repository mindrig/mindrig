import { Result } from "@wrkspc/core/result";
import { Button, Icon, Tag } from "@wrkspc/ds";
import iconRegularAngleDown from "@wrkspc/icons/svg/regular/angle-down.js";
import iconRegularAngleRight from "@wrkspc/icons/svg/regular/angle-right.js";
import iconRegularLoader from "@wrkspc/icons/svg/regular/loader.js";
import { State } from "enso";
import { ResultContent } from "./Content";
import { ResultProvider } from "./Context";
import { ResultMeta } from "./Meta";
import { ResultsState } from "./state";

export { ResultComponent as Result };

export namespace ResultComponent {
  export interface Props {
    state: State<Result>;
    index: number;
    discriminatedLayout: State.Discriminated<ResultsState.Layout, "type">;
    solo: boolean;
  }
}

export function ResultComponent(props: ResultComponent.Props) {
  const { state, index, discriminatedLayout, solo } = props;

  // const headerTitle =
  //   result.label ||
  //   [result.model?.label ?? result.model?.id, result.runLabel]
  //     .filter(Boolean)
  //     .join(" • ") ||
  //   `Result ${index + 1}`;

  const expanded = discriminatedLayout.state.useCompute(
    (layout) => "expanded" in layout && !!layout.expanded[index],
    [],
  );

  const createdAt = state.$.createdAt.useValue();
  const errored = state.useCompute((result) => result.status === "error", []);
  const loading = state.useCompute(
    (result) => result.status === "initialized" || result.status === "running",
    [],
  );

  return (
    <ResultProvider state={state}>
      <div className="border rounded">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="flex items-center gap-2">
            {discriminatedLayout.discriminator === "vertical" && (
              <Button
                style="label"
                icon={expanded ? iconRegularAngleDown : iconRegularAngleRight}
                onClick={() =>
                  discriminatedLayout.state.$.expanded.at(index).set(!expanded)
                }
              />
            )}
            <span className="text-sm font-medium">
              {!solo && <span>#{index + 1}</span>} Result
            </span>

            <div>TODO: Datasource info</div>

            {loading && <Icon id={iconRegularLoader} />}
            {errored && <Tag color="error">Error</Tag>}
          </div>

          <span className="text-xs">
            {new Date(createdAt).toLocaleString()}
          </span>
        </div>

        {expanded && (
          <>
            <ResultMeta state={state} />

            <ResultContent state={state} />
          </>
        )}
      </div>
    </ResultProvider>
  );
}
