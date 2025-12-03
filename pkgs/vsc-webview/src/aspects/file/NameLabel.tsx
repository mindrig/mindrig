import { EditorFile } from "@wrkspc/core/editor";
import { fileNameView } from "@wrkspc/core/file";
import { textCn } from "@wrkspc/ds";
import { cnss } from "cnss";
import { State } from "enso";

export namespace FileNameLabel {
  export interface Props {
    pathState: State<EditorFile.Path>;
    isPinned: boolean;
  }
}

export function FileNameLabel(props: FileNameLabel.Props) {
  const { pathState, isPinned } = props;
  const nameView = pathState.useCompute((path) => fileNameView(path), []);

  return (
    <div className={cnss(isPinned ? "text-active-text" : "")}>
      <span className={textCn({ role: "label" })}>{nameView.main}</span>

      <span
        className={textCn({
          role: "label",
          color: isPinned ? "main" : "detail",
        })}
      >
        {nameView.post}
      </span>
    </div>
  );
}
