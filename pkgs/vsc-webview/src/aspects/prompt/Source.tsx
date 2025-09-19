import type { Prompt } from "@mindrig/types";
import { TextArea } from "@wrkspc/form";
import { useMemo } from "react";

export namespace PromptSource {
  export interface Props {
    prompt: Prompt;
    content: string;
  }
}

export function PromptSource(props: PromptSource.Props) {
  const { prompt, content } = props;
  const span = prompt.span.inner;

  const source = useMemo(
    () => content.slice(span.start, span.end),
    [content, span.start, span.end],
  );

  return <TextArea label={{ a11y: "Prompt" }} value={source} isReadOnly />;
}
