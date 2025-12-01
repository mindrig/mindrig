import { Run } from "@wrkspc/core/run";
import { DescriptionList } from "@wrkspc/ui";

export namespace RunSettingsPreview {
  export interface Props {
    runInit: Run.Init;
  }
}

export function RunSettingsPreview(props: RunSettingsPreview.Props) {
  const { runInit } = props;

  return (
    <DescriptionList
      size="xsmall"
      items={[
        {
          label: "Streaming",
          content: runInit.streaming ? "Enabled" : "Disabled",
        },
      ]}
    />
  );
}
