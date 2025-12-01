import { PlaygroundMap } from "@wrkspc/core/playground";
import { Size } from "@wrkspc/ds";
import { TextArea } from "@wrkspc/ui";

export namespace PromptPreview {
  export interface Props {
    prompt: PlaygroundMap.Prompt;
    size?: Size;
    hideLabel?: boolean;
  }
}

export function PromptPreview(props: PromptPreview.Props) {
  const { prompt, size, hideLabel } = props;

  return (
    <TextArea
      label={hideLabel ? { a11y: "Prompt" } : "Prompt"}
      value={prompt.content}
      size={size}
      mono
      isReadOnly
    />
  );
}
