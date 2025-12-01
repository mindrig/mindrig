import { DescriptionList } from "@wrkspc/ui";
import { timeFormatter } from "../util/date";
import { useRun } from "./Context";
import { RunInitPreview } from "./InitPreview";

export function RunDetailsPreview() {
  const { run } = useRun();
  const runningTime = run.useRunningTimeSec();
  const createdAt = run.useCreatedAt();
  const endedAt = run.useEndedAt();
  const streaming = run.useStreaming();

  return (
    <div className="flex flex-col gap-3">
      <RunInitPreview skipSettings />

      <DescriptionList
        size="xsmall"
        items={[
          {
            label: "Streaming",
            content: streaming ? "Enabled" : "Disabled",
          },
          {
            label: "Created at",
            content: timeFormatter.format(createdAt),
          },
          {
            label: "Ended at",
            content: timeFormatter.format(endedAt),
          },
          {
            label: "Elapsed",
            content: <>{runningTime}s</>,
          },
        ]}
      />
    </div>
  );
}
