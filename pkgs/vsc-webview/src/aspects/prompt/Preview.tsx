import { PlaygroundMap } from "@wrkspc/core/playground";

export namespace PromptPreview {
  export interface Props {
    prompt: PlaygroundMap.Prompt;
  }
}

export function PromptPreview(props: PromptPreview.Props) {
  const { prompt } = props;

  return (
    <pre>
      <code className="flex gap-2">{prompt.content}</code>
    </pre>
  );
}
