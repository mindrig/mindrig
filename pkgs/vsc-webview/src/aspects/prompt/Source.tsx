import { PlaygroundState } from "@wrkspc/core/playground";
import { TextArea } from "@wrkspc/ui";
import { State } from "enso";
import { LayoutSection } from "../layout/Section";
import { useMessages } from "../message/Context";

export namespace PromptSource {
  export interface Props {
    promptState: State<PlaygroundState.Prompt>;
    draft: boolean;
  }
}

export function PromptSource(props: PromptSource.Props) {
  const { promptState, draft } = props;
  const content = promptState.$.prompt.$.content.useValue();
  const { sendMessage } = useMessages();

  return (
    <LayoutSection header="prompt">
      <TextArea
        label={{ a11y: "Prompt" }}
        value={content}
        onChange={(content) => {
          promptState.$.prompt.$.content.set(content);
          sendMessage({
            type: "playground-client-draft-update",
            payload: {
              promptId: promptState.$.prompt.$.id.value,
              content: content,
            },
          });
        }}
        size="small"
        mono
        isReadOnly={!draft}
      />
    </LayoutSection>
  );
}
