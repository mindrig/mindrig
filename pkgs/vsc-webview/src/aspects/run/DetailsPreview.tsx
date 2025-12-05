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
            term: "Streaming",
            description: streaming ? "Enabled" : "Disabled",
          },
          {
            term: "Created at",
            description: timeFormatter.format(createdAt),
          },
          {
            term: "Ended at",
            description: timeFormatter.format(endedAt),
          },
          {
            term: "Elapsed",
            description: <>{runningTime}s</>,
          },
        ]}
      />
    </div>
  );
}
