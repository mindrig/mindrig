import { EditorFile } from "@wrkspc/core/editor";
import { State } from "enso";
import { LanguageIcon } from "../language/Icon";
import { FileNameLabel } from "./NameLabel";

export namespace FileLabel {
  export interface Props {
    fileState: State<EditorFile.Meta>;
    isPinned: boolean;
  }
}

export function FileLabel(props: FileLabel.Props) {
  const { fileState, isPinned } = props;

  return (
    <div>
      <div
        className={
          "inline-flex items-center gap-1 px-1 -mx-1 rounded hover:bg-item-hover"
        }
      >
        <LanguageIcon
          id={fileState.$.languageId}
          color="support"
          size="xsmall"
        />

        <FileNameLabel pathState={fileState.$.path} isPinned={isPinned} />
      </div>
    </div>
  );
}
