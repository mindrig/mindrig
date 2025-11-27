import { PlaygroundState } from "@wrkspc/core/playground";
import { TextArea } from "@wrkspc/form";
import { State } from "enso";
import { LayoutSection } from "../layout/Section";

export namespace PromptSource {
  export interface Props {
    promptState: State<PlaygroundState.Prompt>;
  }
}

export function PromptSource(props: PromptSource.Props) {
  const { promptState } = props;
  const content = promptState.$.prompt.$.content.useValue();

  return (
    <LayoutSection>
      <TextArea label={{ a11y: "Prompt" }} value={content} isReadOnly />
    </LayoutSection>
  );
}
