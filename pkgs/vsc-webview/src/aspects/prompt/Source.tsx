import { PlaygroundState } from "@wrkspc/core/playground";
import iconRegularTrashAlt from "@wrkspc/icons/svg/regular/trash-alt.js";
import { Button, TextAreaController } from "@wrkspc/ui";
import { Field, State } from "enso";
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
  const promptId = promptState.$.prompt.$.id.useValue();
  const contentField = Field.use(promptState.$.prompt.$.content.value, [
    promptId,
  ]);
  const { sendMessage } = useMessages();

  contentField.useWatch(
    (content) => {
      promptState.$.prompt.$.content.set(content);

      sendMessage({
        type: "playground-client-draft-update",
        payload: {
          promptId,
          content,
        },
      });
    },
    [promptState, promptId],
  );

  return (
    <LayoutSection
      header={draft ? "Prompt draft" : "Prompt"}
      actions={
        draft && (
          <Button
            icon={iconRegularTrashAlt}
            size="xsmall"
            style="label"
            onClick={() =>
              sendMessage({
                type: "playground-client-draft-delete",
                payload: { promptId },
              })
            }
          />
        )
      }
    >
      <TextAreaController
        label={{ a11y: "Prompt" }}
        description={draft && "Use {{variableName}} to insert a variable."}
        field={contentField}
        size={draft ? "medium" : "small"}
        mono
        isReadOnly={!draft}
        placeholder={draft ? "Enter you prompt here..." : "No content"}
        autoFocus={draft}
      />
    </LayoutSection>
  );
}
