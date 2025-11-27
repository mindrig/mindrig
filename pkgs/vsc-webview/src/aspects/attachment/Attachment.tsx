import { Attachment } from "@wrkspc/core/attachment";
import { Button } from "@wrkspc/ds";
import iconRegularTrashAlt from "@wrkspc/icons/svg/regular/trash-alt.js";
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
    <div className="flex justify-between gap-2">
      <AttachmentPreview attachment={attachment} />

      <div>
        <Button
          size="xsmall"
          style="label"
          color="secondary"
          icon={iconRegularTrashAlt}
          onClick={() => attachmentField.self.remove()}
        />
      </div>
    </div>
  );
}
