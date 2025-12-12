import { FileLabel } from "@/aspects/file/Label";
import { EditorFile } from "@wrkspc/core/editor";
import { playgroundStatePromptToCodeRef } from "@wrkspc/core/playground";
import { Button } from "@wrkspc/ds";
import iconRegularThumbtackAngle from "@wrkspc/icons/svg/regular/thumbtack-angle.js";
import iconSolidThumbtack from "@wrkspc/icons/svg/solid/thumbtack.js";
import { cnss } from "cnss";
import { State } from "enso";
import { useClientState } from "../client/StateContext";
import { LayoutSection } from "../layout/Section";
import { useMessages } from "../message/Context";
import { PlaygroundPromptSelector } from "../playground/PromptSelector";

export namespace FileHeader {
  export interface Props {
    fileState: State<EditorFile.Meta>;
  }
}

export function FileHeader(props: FileHeader.Props) {
  const { fileState } = props;
  const clientState = useClientState();
  const { sendMessage } = useMessages();

  const isPinned = clientState.$.playground.$.pin.useCompute(
    (pin) => !!pin,
    [],
  );

  const promptRef = clientState.$.playground.$.prompt.useCompute(
    (prompt) => playgroundStatePromptToCodeRef(prompt),
    [],
  );
  const isDraft = promptRef?.type === "draft";

  return (
    <LayoutSection style="header" sticky="top">
      <div className="flex items-center justify-between gap-2">
        <FileLabel fileState={fileState} isPinned={isPinned && !isDraft} />

        <div className="flex items-center gap-2 max-w-60 w-full">
          <PlaygroundPromptSelector />

          <div className={cnss("inline-flex", isPinned && "text-active-text")}>
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
