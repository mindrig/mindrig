import { Prompt } from "@mindrig/types";
import { EditorFile } from "@wrkspc/core/editor";
import { Assessment } from "../assessment/Assessment";
import { PanelSection } from "../panel/Section";
import { PromptSource } from "../prompt/Source";
import { useSettings } from "../settings/Context";

export namespace Blueprint {
  export interface Props {
    file: EditorFile;
    prompt: Prompt;
    vercelGatewayKey: string | undefined | null;
    promptIndex: number | null;
    showSource?: boolean;
    isPromptPinned?: boolean;
  }
}

export function Blueprint(props: Blueprint.Props) {
  const {
    file,
    prompt,
    vercelGatewayKey,
    promptIndex,
    showSource,
    isPromptPinned,
  } = props;
  const { settings } = useSettings();
  const shouldShowSource =
    isPromptPinned ||
    (typeof showSource === "boolean"
      ? showSource
      : settings?.playground?.showSource);

  return (
    <PanelSection>
      {shouldShowSource && (
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
