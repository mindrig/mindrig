import { Attachment, AttachmentRequest } from "@wrkspc/core/attachment";
import { Button } from "@wrkspc/ds";
import iconRegularPaperclip from "@wrkspc/icons/svg/regular/paperclip.js";
import { Field } from "enso";
import { nanoid } from "nanoid";
import { LayoutSection } from "../layout/Section";
import { useMessages } from "../message/Context";
import { AttachmentComponent } from "./Attachment";

export namespace Attachments {
  export interface Props {
    field: Field<Attachment[]>;
  }
}

export function Attachments(props: Attachments.Props) {
  const { send } = useMessages();
  const field = props.field.useCollection();

  if (!field.size) return null;

  return (
    <>
      <LayoutSection size="small">
        <div>
          <Button
            style="label"
            icon={iconRegularPaperclip}
            size="xsmall"
            onClick={() => {
              const requestId: AttachmentRequest.Id = nanoid();
              send({
                type: "attachment-client-request",
                payload: {
                  requestId,
                  modalities: ["text", "image", "audio", "video", "pdf"],
                },
              });
            }}
          >
            Attach file
          </Button>
        </div>
      </LayoutSection>

      <div className="space-y-3">
        {field.map((attachmentField) => (
          <AttachmentComponent
            key={attachmentField.key}
            field={attachmentField}
          />
        ))}
      </div>
    </>
  );
}
