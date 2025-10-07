import { EditorFile } from "@wrkspc/core/editor";
import { LanguageIcon } from "../language/Icon";
import { FileNameLabel } from "./NameLabel";

export namespace FileLabel {
  export interface Props {
    file: EditorFile;
    isPinned: boolean;
  }
}

export function FileLabel(props: FileLabel.Props) {
  const { file, isPinned } = props;
  return (
    <div>
      <div
        className={
          "inline-flex items-center gap-1 px-1 -mx-1 rounded hover:bg-item-hover"
        }
      >
        <LanguageIcon id={file.languageId} color="support" size="xsmall" />
        <FileNameLabel path={file.path} isPinned={isPinned} />
      </div>
    </div>
  );
}
