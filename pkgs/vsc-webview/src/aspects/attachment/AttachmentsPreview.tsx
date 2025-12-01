import { Attachment } from "@wrkspc/core/attachment";
import { fieldCn, Label } from "@wrkspc/ui";
import { AttachmentPreview } from "./AttachmentPreview";

export namespace AttachmentsPreview {
  export interface Props {
    attachments: Attachment[];
  }
}

export function AttachmentsPreview(props: AttachmentsPreview.Props) {
  const { attachments } = props;

  return (
    <div className={fieldCn({ size: "small" })}>
      <Label size="xsmall">Attachments</Label>

      <div className="flex flex-col gap-2">
        {attachments.map((attachment) => (
          <AttachmentPreview key={attachment.path} attachment={attachment} />
        ))}
      </div>
    </div>
  );
}
