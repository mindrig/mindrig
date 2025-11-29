import { Attachment } from "@wrkspc/core/attachment";
import { fileSizeFormatter } from "@wrkspc/core/file";
import { FilePreviewComponent } from "../file/Preview";
import { AttachmentIcon } from "./Icon";

export namespace AttachmentPreview {
  export interface Props {
    attachment: Attachment;
  }
}

export function AttachmentPreview(props: AttachmentPreview.Props) {
  const { attachment } = props;
  return (
    <FilePreviewComponent
      icon={<AttachmentIcon mime={attachment.mime} color="detail" />}
      info={attachment}
      meta={[fileSizeFormatter.format(attachment.size), attachment.mime]}
    />
  );
}
