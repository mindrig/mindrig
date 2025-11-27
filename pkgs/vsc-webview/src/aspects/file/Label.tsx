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
  const languageId = fileState.$.languageId.useValue();

  return (
    <div className="flex items-center gap-1">
      <LanguageIcon id={languageId} color="support" size="small" />

      <FileNameLabel pathState={fileState.$.path} isPinned={isPinned} />
    </div>
  );
}
