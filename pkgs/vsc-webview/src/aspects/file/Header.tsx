import { FileLabel } from "@/aspects/file/Label";
import { EditorFile } from "@wrkspc/core/editor";
import { playgroundStatePromptToRef } from "@wrkspc/core/playground";
import { Button } from "@wrkspc/ds";
import { Select } from "@wrkspc/form";
import iconRegularThumbtackAngle from "@wrkspc/icons/svg/regular/thumbtack-angle.js";
import iconSolidThumbtack from "@wrkspc/icons/svg/solid/thumbtack.js";
import { cn } from "crab";
import { State } from "enso";
import { useClientState } from "../client/StateContext";
import { LayoutSection } from "../layout/Section";
import { useMessages } from "../message/Context";

export namespace FileHeader {
  export interface Props {
    fileState: State<EditorFile.Meta>;
  }
}

export function FileHeader(props: FileHeader.Props) {
  const { fileState } = props;
  const clientState = useClientState();
  const { sendMessage } = useMessages();

  const prompts = clientState.$.playground.$.prompts.useCollection();
  const isPinned = clientState.$.playground.$.pin.useCompute(
    (pin) => !!pin,
    [],
  );

  const [promptId, promptRef] = clientState.$.playground.$.prompt.useCompute(
    (prompt) => [prompt?.prompt.id, playgroundStatePromptToRef(prompt)],
    [],
  );

  return (
    <LayoutSection top bordered pinned={isPinned}>
      <div className="flex items-center justify-between gap-2">
        <FileLabel fileState={fileState} isPinned={isPinned} />

        <div className="flex items-center gap-2">
          <Select
            label={{ a11y: "Select prompt" }}
            size="xsmall"
            selectedKey={promptId || null}
            options={prompts.map((prompt) => ({
              label: prompt.$.preview.value,
              value: prompt.$.promptId.value,
            }))}
            placeholder={prompts.size ? "Select prompt" : "No prompts"}
            isDisabled={!prompts.size}
            onSelectionChange={(itemPromptId) => {
              const prompt = prompts.find(
                (prompt) => promptId === itemPromptId,
              );
              sendMessage({
                type: "playground-client-prompt-change",
                payload: prompt?.value || null,
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
                if (isPinned) sendMessage({ type: "playground-client-unpin" });
                else if (promptRef)
                  sendMessage({
                    type: "playground-client-pin",
                    payload: promptRef,
                  });
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
