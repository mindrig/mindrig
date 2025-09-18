import { Prompt } from "@mindcontrol/code-types";
import { SyncFile } from "@mindcontrol/vscode-sync";
import { Assessment } from "../assessment/Assessment";
import { PanelSection } from "../panel/Section";
import { PromptSource } from "../prompt/Source";
import { useSettings } from "../settings/Context";

export namespace Blueprint {
  export interface Props {
    file: SyncFile.State;
    prompt: Prompt;
    showSource: boolean;
    vercelGatewayKey: string | null;
    promptIndex: number | null;
  }
}

export function Blueprint(props: Blueprint.Props) {
  const { file, prompt, vercelGatewayKey, promptIndex } = props;
  const { settings } = useSettings();

  return (
    <PanelSection>
      {settings?.playground?.showSource && (
        <PromptSource prompt={prompt} content={file.content} />
      )}

      <Assessment
        prompt={prompt}
        vercelGatewayKey={vercelGatewayKey}
        fileContent={file.content}
        promptIndex={promptIndex}
      />
    </PanelSection>
  );
}
