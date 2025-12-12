import { PlaygroundState } from "@wrkspc/core/playground";
import { textCn } from "@wrkspc/ds";
import { Label, Select } from "@wrkspc/ui";
import { cnss } from "cnss";
import { PlaygroundMap } from "node_modules/@wrkspc/core/src/playground/map";
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
  const hasFilePrompts = clientState.$.playground.$.prompts.useCompute(
    (prompts) => prompts.some((prompt) => prompt.type === "code"),
    [],
  );
  const hasDrafts = clientState.$.playground.$.prompts.useCompute(
    (prompts) => prompts.some((prompt) => prompt.type === "draft"),
    [],
  );

  return (
    <Select
      label={{ a11y: "Select prompt" }}
      size="xsmall"
      value={promptId || null}
      options={[
        {
          type: "section",
          label: "File prompts",
          options: prompts.map((promptState) => {
            const prompt = promptState.value;
            if (prompt.type !== "code") return null;
            return {
              label: itemLabel(prompt),
              value: prompt.promptId,
            };
          }),
          flatten: !hasDrafts || !hasFilePrompts,
        },
        {
          type: "section",
          label: "Drafts",
          options: prompts.map<Select.OptionItemNested<PlaygroundMap.PromptId>>(
            (promptState) => {
              const prompt = promptState.value;
              if (prompt.type !== "draft") return null;
              return {
                label: itemLabel(prompt),
                value: prompt.promptId,
              };
            },
          ),
          flatten: !hasDrafts,
        },
      ]}
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

function itemLabel(prompt: PlaygroundState.PromptItem): Label.Prop {
  return {
    node: (
      <span
        className={cnss(
          "truncate",
          prompt.type === "code" && "font-mono",
          !prompt.preview && textCn({ italic: true, color: "detail" }),
        )}
      >
        {prompt.preview || "No content"}
      </span>
    ),
    a11y: prompt.preview || "No content",
  };
}
