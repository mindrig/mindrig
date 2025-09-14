import { Prompt } from "@mindcontrol/code-types";
import { SyncFile } from "@mindcontrol/vscode-sync";
import { Assessment } from "../assessment/Assessment";
import { PromptSource } from "../prompt/Source";

export namespace Blueprint {
  export interface Props {
    file: SyncFile.State;
    vscode: {
      postMessage: (message: any) => void;
      getState: () => any;
      setState: (state: any) => void;
    } | null;
    prompt: Prompt;
    vercelGatewayKey: string | null;
  }
}

export function Blueprint(props: Blueprint.Props) {
  const { file, vscode, prompt, vercelGatewayKey } = props;

  return (
    <div className="flex flex-col gap-2">
      <PromptSource prompt={prompt} content={file.content} />

      <Assessment
        prompt={prompt}
        vscode={vscode}
        vercelGatewayKey={vercelGatewayKey}
        fileContent={file.content}
      />
    </div>
  );
}
