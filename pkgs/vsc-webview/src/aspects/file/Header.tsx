import { FileLabel } from "@/aspects/file/Label";
import { EditorFile } from "@wrkspc/core/editor";
import { playgroundStatePromptToRef } from "@wrkspc/core/playground";
import { Button } from "@wrkspc/ds";
import { Select } from "@wrkspc/form";
import iconRegularThumbtackAngle from "@wrkspc/icons/svg/regular/thumbtack-angle.js";
import iconSolidThumbtack from "@wrkspc/icons/svg/solid/thumbtack.js";
import { cn } from "crab";
import { LayoutSection } from "../layout/Section";
import { useMessages } from "../message/Context";
import { usePlaygroundState } from "../playground/StateContext";

export namespace FileHeader {
  export interface Props {
    file: EditorFile.Meta;
  }
}

export function FileHeader(props: FileHeader.Props) {
  const { file } = props;
  const { prompts, prompt, pin } = usePlaygroundState();
  const { send } = useMessages();

  const isPinned = !!pin;
  const promptRef = playgroundStatePromptToRef(prompt);

  return (
    <LayoutSection top bordered pinned={isPinned}>
      <div className="flex items-center justify-between gap-2">
        <FileLabel file={file} isPinned={isPinned} />

        <div className="flex items-center gap-2">
          <Select
            label={{ a11y: "Select prompt" }}
            size="xsmall"
            selectedKey={prompt?.promptId || null}
            options={prompts.map((prompt) => ({
              label: prompt.preview,
              value: prompt.promptId,
            }))}
            placeholder={prompts.length ? "Select prompt" : "No prompts"}
            isDisabled={!prompts.length}
            onSelectionChange={(promptId) => {
              const prompt =
                prompts.find((prompt) => prompt.promptId === promptId) || null;
              send({
                type: "playground-client-prompt-change",
                payload: prompt,
              });
            }}
          />

          <div className={cn("inline-flex", isPinned && "text-active-text")}>
            <Button
              style="label"
              color={isPinned ? "current" : "secondary"}
              icon={isPinned ? iconSolidThumbtack : iconRegularThumbtackAngle}
              isDisabled={!promptRef}
              onClick={() => {
                if (isPinned) send({ type: "playground-client-unpin" });
                else if (promptRef)
                  send({ type: "playground-client-pin", payload: promptRef });
              }}
              aria-pressed={isPinned}
              aria-label={isPinned ? "Unpin prompt" : "Pin prompt"}
            />
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}
