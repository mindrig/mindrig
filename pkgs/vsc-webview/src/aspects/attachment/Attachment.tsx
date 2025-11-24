import { Attachment } from "@wrkspc/core/attachment";
import { Button } from "@wrkspc/ds";
import iconRegularTimes from "@wrkspc/icons/svg/regular/times.js";
import { Field } from "enso";

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
      <div>
        <span>{attachment.name}</span>
        <span>{attachment.path}</span>
      </div>

      <div>
        <span>Size: {attachment.size}</span>
        <span>Mime: {attachment.mime}</span>
      </div>

      <Button
        size="xsmall"
        style="label"
        icon={iconRegularTimes}
        onClick={() => attachmentField.self.remove()}
      />
    </div>
  );
}
