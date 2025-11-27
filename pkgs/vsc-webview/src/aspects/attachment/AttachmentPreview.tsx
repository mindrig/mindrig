import { Attachment } from "@wrkspc/core/attachment";
import { fileSizeFormatter } from "@wrkspc/core/file";
import { textCn } from "@wrkspc/ds";
import { AttachmentIcon } from "./Icon";

export namespace AttachmentPreview {
  export interface Props {
    attachment: Attachment;
  }
}

export function AttachmentPreview(props: AttachmentPreview.Props) {
  const { attachment } = props;

  return (
    <div className="flex gap-1">
      <div className="shrink-0">
        <AttachmentIcon mime={attachment.mime} color="detail" />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <div
            className={textCn({
              role: "label",
              size: "small",
              className: "shrink-0 lading-none",
            })}
          >
            {attachment.name}
          </div>

          <div
            title={attachment.path}
            className={textCn({
              size: "xsmall",
              color: "detail",
              truncate: true,
              className: "lading-none",
            })}
          >
            {attachment.path}
          </div>
        </div>

        <div
          className={textCn({
            size: "xsmall",
            color: "support",
            className: "leading-none",
          })}
        >
          {fileSizeFormatter.format(attachment.size)} • {attachment.mime}
        </div>
      </div>
    </div>
  );
}
