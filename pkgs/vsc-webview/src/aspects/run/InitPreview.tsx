import { AttachmentsPreview } from "../attachment/AttachmentsPreview";
import { PromptPreview } from "../prompt/Preview";
import { useRun } from "./Context";
import { RunSettingsPreview } from "./SettingsPreview";

export namespace RunInitPreview {
  export interface Props {
    skipSettings?: boolean | undefined;
  }
}

export function RunInitPreview(props: RunInitPreview.Props) {
  const { skipSettings } = props;
  const { run } = useRun();
  const runInit = run.useInit();

  return (
    <>
      <PromptPreview size="xsmall" prompt={runInit.prompt} />

      {/* <ToolsPreview tools={runInit.tools} /> */}

      <AttachmentsPreview attachments={runInit.attachments} />

      {!skipSettings && <RunSettingsPreview runInit={runInit} />}
    </>
  );
}
