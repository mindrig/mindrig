import { Attachment } from "@wrkspc/core/attachment";

export namespace AttachmentPreview {
  export interface Props {
    attachment: Attachment;
  }
}

export function AttachmentPreview(props: AttachmentPreview.Props) {
  const { attachment } = props;

  return (
    <div>
      <div className="flex gap-2">
        <span>{attachment.name}</span>
        <span>{attachment.path}</span>
      </div>

      <div className="flex gap-2">
        <span>Size: {attachment.size}</span>
        <span>Mime: {attachment.mime}</span>
      </div>
    </div>
  );
}
