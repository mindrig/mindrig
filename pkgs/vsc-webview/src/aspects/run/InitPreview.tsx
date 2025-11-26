import { Button } from "@wrkspc/ds";
import { useState } from "react";
import { AttachmentsPreview } from "../attachment/AttachmentsPreview";
import { PromptPreview } from "../prompt/Preview";
import { useRun } from "./Context";
import { RunSettingsPreview } from "./SettingsPreview";

export function RunInitPreview() {
  const { run } = useRun();
  const runInit = run.useInit();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium">Run Init</h5>

        <Button
          size="xsmall"
          style="transparent"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Hide run init" : "Show run init"}
        </Button>
      </div>

      {expanded && (
        <div className="p-3 rounded border overflow-auto">
          <PromptPreview prompt={runInit.prompt} />

          {/* <ToolsPreview tools={runInit.tools} /> */}

          <AttachmentsPreview attachments={runInit.attachments} />

          <RunSettingsPreview runInit={runInit} />
        </div>
      )}
    </div>
  );
}
