import { textCn } from "@wrkspc/ds";
import { fileNameView } from "@wrkspc/file";
import { cn } from "crab";
import { useMemo } from "react";

export namespace FileNameLabel {
  export interface Props {
    path: string;
    isPinned: boolean;
  }
}

export function FileNameLabel(props: FileNameLabel.Props) {
  const { path, isPinned } = props;
  const nameView = useMemo(() => fileNameView(path), [path]);
  return (
    <div className={cn(isPinned ? "text-active-text" : "")}>
      <span>{nameView.main}</span>
      <span className={textCn({ color: isPinned ? "main" : "detail" })}>
        {nameView.post}
      </span>
    </div>
  );
}
