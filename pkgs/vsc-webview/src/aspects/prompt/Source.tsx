import { PlaygroundState } from "@wrkspc/core/playground";
import { TextArea } from "@wrkspc/form";

export namespace PromptSource {
  export interface Props {
    prompt: PlaygroundState.Prompt;
  }
}

export function PromptSource(props: PromptSource.Props) {
  const { prompt } = props;
  return (
    <TextArea label={{ a11y: "Prompt" }} value={prompt.content} isReadOnly />
  );
}
