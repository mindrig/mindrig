import { PlaygroundState } from "@wrkspc/core/playground";
import { TextArea } from "@wrkspc/form";
import { LayoutSection } from "../layout/Section";

export namespace PromptSource {
  export interface Props {
    prompt: PlaygroundState.Prompt;
  }
}

export function PromptSource(props: PromptSource.Props) {
  const { prompt } = props;
  return (
    <LayoutSection bordered>
      <TextArea label={{ a11y: "Prompt" }} value={prompt.content} isReadOnly />
    </LayoutSection>
  );
}
