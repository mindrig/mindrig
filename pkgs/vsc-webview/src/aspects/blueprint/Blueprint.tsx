import { EditorFile } from "@wrkspc/core/editor";
import { PlaygroundState } from "@wrkspc/core/playground";
import { Assessment } from "../assessment/Assessment";
import { PanelSection } from "../panel/Section";
import { PromptSource } from "../prompt/Source";
import { useSettings } from "../settings/Context";

export namespace Blueprint {
  export interface Props {
    file: EditorFile.Meta;
    prompt: PlaygroundState.Prompt;
  }
}

export function Blueprint(props: Blueprint.Props) {
  const { file, prompt } = props;
  const { settings } = useSettings();

  return (
    <PanelSection>
      {settings.playground?.showSource && <PromptSource prompt={prompt} />}

      <Assessment prompt={prompt} />
    </PanelSection>
  );
}
