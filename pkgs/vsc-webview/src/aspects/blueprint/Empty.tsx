import { textCn } from "@wrkspc/ds";
import iconRegularHandPointer from "@wrkspc/icons/svg/regular/hand-pointer.js";
import { Button } from "@wrkspc/ui";
import { useMessages } from "../message/Context";
import { PageEmpty } from "../page/Empty";
import { PlaygroundPromptSelector } from "../playground/PromptSelector";

export function BlueprintEmpty() {
  const { sendMessage } = useMessages();
  return (
    <PageEmpty
      icon={iconRegularHandPointer}
      label="No prompt selected"
      description="Focus a prompt in the source code to test it."
      actions={
        <>
          <Button
            size="xsmall"
            onClick={() => sendMessage({ type: "playground-client-new-draft" })}
          >
            New Prompt
          </Button>

          <span className={textCn({ size: "small", color: "detail" })}>or</span>

          <PlaygroundPromptSelector />
        </>
      }
    />
  );
}
