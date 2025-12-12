import { EditorFile } from "@wrkspc/core/editor";
import { textCn } from "@wrkspc/ds";
import iconRegularFileBan from "@wrkspc/icons/svg/regular/file-ban.js";
import iconRegularHandPointer from "@wrkspc/icons/svg/regular/hand-pointer.js";
import { Button } from "@wrkspc/ui";
import { State } from "enso";
import { useMessages } from "../message/Context";
import { PageEmpty } from "../page/Empty";
import { PlaygroundPromptSelector } from "../playground/PromptSelector";

export namespace BlueprintEmpty {
  export interface Props {
    fileState: State<EditorFile.Meta>;
  }
}

export function BlueprintEmpty(props: BlueprintEmpty.Props) {
  const { fileState } = props;
  const { sendMessage } = useMessages();

  const isUnknown = fileState.$.languageId.useCompute(
    (langId) => langId === "unknown",
    [],
  );

  return (
    <PageEmpty
      icon={isUnknown ? iconRegularFileBan : iconRegularHandPointer}
      label={isUnknown ? "Unsupported file type" : "No prompt selected"}
      description={
        isUnknown
          ? "The parser doesn't currently support the file type."
          : "Focus a prompt in the source code to test it."
      }
      actions={
        <>
          <Button
            size="xsmall"
            onClick={() => sendMessage({ type: "playground-client-new-draft" })}
          >
            New Prompt Draft
          </Button>

          <span className={textCn({ size: "small", color: "detail" })}>or</span>

          <PlaygroundPromptSelector />
        </>
      }
    />
  );
}
