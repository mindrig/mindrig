import { PlaygroundState } from "@wrkspc/core/playground";
import { State } from "enso";
import { LayoutSection } from "../layout/Section";
import { PromptPreview } from "./Preview";

export namespace PromptSource {
  export interface Props {
    promptState: State<PlaygroundState.Prompt>;
  }
}

export function PromptSource(props: PromptSource.Props) {
  const { promptState } = props;
  const content = promptState.$.prompt.useValue();

  return (
    <LayoutSection header="prompt">
      <PromptPreview size="small" prompt={content} />
    </LayoutSection>
  );
}
