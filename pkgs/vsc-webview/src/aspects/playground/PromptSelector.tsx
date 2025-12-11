import { Select } from "@wrkspc/ui";
import { useClientState } from "../client/StateContext";
import { useMessages } from "../message/Context";

export namespace PlaygroundPromptSelector {
  export interface Props {}
}

export function PlaygroundPromptSelector(
  props: PlaygroundPromptSelector.Props,
) {
  const clientState = useClientState();
  const { sendMessage } = useMessages();

  const promptId = clientState.$.playground.$.prompt.useCompute(
    (prompt) => prompt?.prompt.id,
    [],
  );

  const prompts = clientState.$.playground.$.prompts.useCollection();

  return (
    <Select
      label={{ a11y: "Select prompt" }}
      size="xsmall"
      value={promptId || null}
      options={prompts.map((prompt) => ({
        label: prompt.$.preview.value,
        value: prompt.$.promptId.value,
      }))}
      placeholder={prompts.size ? "Select prompt" : "No prompts"}
      isDisabled={!prompts.size}
      onChange={(itemPromptId) => {
        const prompt = prompts.find(
          (prompt) => prompt.$.promptId.value === itemPromptId,
        );
        sendMessage({
          type: "playground-client-prompt-change",
          payload: prompt?.value || null,
        });
      }}
    />
  );
}
