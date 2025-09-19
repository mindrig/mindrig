import { Prompt } from "@mindrig/types";
import { SyncFile } from "@wrkspc/vsc-sync";
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
