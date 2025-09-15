import { Prompt } from "@mindcontrol/code-types";
import { SyncFile } from "@mindcontrol/vscode-sync";
import { Assessment } from "../assessment/Assessment";
import { PromptSource } from "../prompt/Source";

export namespace Blueprint {
  export interface Props {
    file: SyncFile.State;
    prompt: Prompt;
    vercelGatewayKey: string | null;
  }
}

export function Blueprint(props: Blueprint.Props) {
  const { file, prompt, vercelGatewayKey } = props;

  return (
    <div className="flex flex-col gap-2">
      <PromptSource prompt={prompt} content={file.content} />

      <Assessment
        prompt={prompt}
        vercelGatewayKey={vercelGatewayKey}
        fileContent={file.content}
      />
    </div>
  );
}
