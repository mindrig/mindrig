import { FileInfo } from "@wrkspc/core/file";
import { textCn } from "@wrkspc/ds";
import { ReactNode } from "react";

export namespace FileInfoComponent {
  export interface Props {
    info: FileInfo;
    actions?: ReactNode | undefined;
  }
}

export function FileInfoComponent(props: FileInfoComponent.Props) {
  const { info, actions } = props;

  return (
    <div className="flex gap-2 justify-between">
      <div className="flex items-center gap-2">
        <div
          className={textCn({
            role: "label",
            size: "small",
            className: "shrink-0 lading-none",
          })}
        >
          {info.name}
        </div>

        <div
          title={info.path}
          className={textCn({
            size: "xsmall",
            color: "detail",
            truncate: true,
            className: "lading-none",
          })}
        >
          {info.path}
        </div>
      </div>

      {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
