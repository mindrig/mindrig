import { PlaygroundMap } from "@wrkspc/core/playground";
import { Size } from "@wrkspc/ds";
import { TextArea } from "@wrkspc/ui";

export namespace PromptPreview {
  export interface Props {
    prompt: PlaygroundMap.Prompt;
    size?: Size;
  }
}

export function PromptPreview(props: PromptPreview.Props) {
  const { prompt, size } = props;

  return (
    <TextArea
      label={{ a11y: "Prompt" }}
      value={prompt.content}
      size={size}
      mono
      isReadOnly
    />
  );
}
