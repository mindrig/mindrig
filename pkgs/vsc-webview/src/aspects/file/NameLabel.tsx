import { textCn } from "@wrkspc/ds";
import { fileNameView } from "@wrkspc/file";
import { useMemo } from "react";

export namespace FileNameLabel {
  export interface Props {
    path: string;
  }
}

export function FileNameLabel(props: FileNameLabel.Props) {
  const { path } = props;
  const nameView = useMemo(() => fileNameView(path), [path]);
  return (
    <div>
      <span>{nameView.main}</span>
      <span className={textCn({ color: "detail" })}>{nameView.post}</span>
    </div>
  );
}
