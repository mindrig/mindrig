import { Attachment } from "@wrkspc/core/attachment";
import { Button } from "@wrkspc/ds";
import iconRegularTimes from "@wrkspc/icons/svg/regular/times.js";
import { Field } from "enso";
import { AttachmentPreview } from "./AttachmentPreview";

export { AttachmentComponent as Attachment };

export namespace AttachmentComponent {
  export interface Props {
    attachmentField: Field<Attachment, "detachable">;
  }
}

export function AttachmentComponent(props: AttachmentComponent.Props) {
  const { attachmentField } = props;
  const attachment = attachmentField.useValue();
  return (
    <div>
      <AttachmentPreview attachment={attachment} />

      <Button
        size="xsmall"
        style="label"
        icon={iconRegularTimes}
        onClick={() => attachmentField.self.remove()}
      />
    </div>
  );
}
