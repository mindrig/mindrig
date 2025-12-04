import { Block, Button, Icon, Tag, textCn } from "@wrkspc/ds";
import iconRegularChevronDown from "@wrkspc/icons/svg/regular/chevron-down.js";
import iconRegularChevronRight from "@wrkspc/icons/svg/regular/chevron-right.js";
import iconRegularHourglass from "@wrkspc/icons/svg/regular/hourglass.js";
import { useEffect, useState } from "react";
import { RunManager } from "../run/Manager";
import { useResult } from "./Context";

export namespace ResultHeader {
  export interface Props {
    resultIndex: number;
    solo: boolean;
    expanded: ExpandedProp | false;
  }

  export interface ExpandedProp {
    value: boolean;
    set(next: boolean): void;
  }
}

export function ResultHeader(props: ResultHeader.Props) {
  const { resultIndex, solo, expanded } = props;
  const { resultState } = useResult();

  const running = resultState.useCompute(
    (result) => result.status === "initialized" || result.status === "running",
    [],
  );

  const startedAt = resultState.useCompute(
    (result) => ("startedAt" in result && result.startedAt) || undefined,
    [],
  );
  const endedAt = resultState.useCompute(
    (result) => ("endedAt" in result && result.endedAt) || undefined,
    [],
  );

  const [runningTimeMs, setRunningTime] = useState(
    startedAt && RunManager.calculateRunningTime(startedAt, endedAt),
  );

  useEffect(() => {
    if (!running) {
      startedAt &&
        setRunningTime(RunManager.calculateRunningTime(startedAt, endedAt));
      return;
    }

    const interval = setInterval(
      () =>
        startedAt &&
        setRunningTime(RunManager.calculateRunningTime(startedAt, undefined)),
      100,
    );
    return () => clearInterval(interval);
  }, [running, startedAt, endedAt]);
  const runningTimeSec = runningTimeMs && Math.floor(runningTimeMs / 100) / 10;

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

  const errored = resultState.useCompute(
    (result) => result.status === "error",
    [],
  );
  const cancelled = resultState.useCompute(
    (result) => result.status === "cancelled",
    [],
  );

  return (
    <Block pad="small" align justify="between" border="bottom">
      <Block size="small" align>
        {expanded && (
          <Button
            style="label"
            size="small"
            color="secondary"
            icon={expanded ? iconRegularChevronDown : iconRegularChevronRight}
            onClick={() => expanded.set(!expanded.value)}
          />
        )}

        {!solo && (
          <span
            className={textCn({
              role: "label",
              color: "support",
              leading: "none",
            })}
          >
            #{resultIndex + 1}
          </span>
        )}

        <Block size="xsmall" align>
          <div
            className={textCn({
              size: "small",
              color: "detail",
              leading: "none",
            })}
          >
            <Tag size="xsmall">{modelLabel}</Tag>

            {rowLabel && (
              <>
                {" "}
                × <Tag size="xsmall">{rowLabel}</Tag>
              </>
            )}
          </div>
        </Block>

        {errored && (
          <Tag size="small" color="error">
            Error
          </Tag>
        )}

        {cancelled && (
          <Tag size="small" color="error">
            Cancelled
          </Tag>
        )}
      </Block>

      <Block align size="small">
        <span className={textCn({ size: "xsmall", color: "detail" })}>
          {/* {timeFormatter.format(createdAt)} */}
          {runningTimeSec ? (
            <>{runningTimeSec}s</>
          ) : (
            <>
              <Icon id={iconRegularHourglass} color="detail" size="small" />
            </>
          )}
        </span>
      </Block>
    </Block>
  );
}
