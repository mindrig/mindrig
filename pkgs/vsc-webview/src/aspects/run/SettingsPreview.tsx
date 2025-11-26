import { Run } from "@wrkspc/core/run";

export namespace RunSettingsPreview {
  export interface Props {
    runInit: Run.Init;
  }
}

export function RunSettingsPreview(props: RunSettingsPreview.Props) {
  const { runInit } = props;

  return (
    <div>
      <div className="flex gap-2">
        <div>Streaming:</div>
        <div>{runInit.streaming ? "Enabled" : "Disabled"}</div>
      </div>
    </div>
  );
}
