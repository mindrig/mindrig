import { Attachment } from "@wrkspc/core/attachment";
import { AttachmentPreview } from "./AttachmentPreview";

export namespace AttachmentsPreview {
  export interface Props {
    attachments: Attachment[];
  }
}

export function AttachmentsPreview(props: AttachmentsPreview.Props) {
  const { attachments } = props;

  return (
    <div>
      {attachments.map((attachment) => (
        <AttachmentPreview key={attachment.path} attachment={attachment} />
      ))}
    </div>
  );
}
