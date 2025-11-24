import { Attachment } from "@wrkspc/core/attachment";
import { Button } from "@wrkspc/ds";
import iconRegularPaperclip from "@wrkspc/icons/svg/regular/paperclip.js";
import { Field } from "enso";
import { LayoutSection } from "../layout/Section";
import { useMessages } from "../message/Context";
import { useTest } from "../test/Context";
import { AttachmentComponent } from "./Attachment";

export namespace Attachments {
  export interface Props {
    attachmentsField: Field<Attachment[]>;
  }
}

export function Attachments(props: Attachments.Props) {
  const { test } = useTest();
  const { sendMessage } = useMessages();
  const attachmentsField = props.attachmentsField.useCollection();

  return (
    <>
      <LayoutSection size="small">
        <div>
          <Button
            style="label"
            icon={iconRegularPaperclip}
            size="xsmall"
            onClick={() => test.attachFile()}
          >
            Attach file
          </Button>
        </div>
      </LayoutSection>

      {!!attachmentsField.size && (
        <div className="space-y-3">
          {attachmentsField.map((attachmentField) => (
            <AttachmentComponent
              key={attachmentField.id}
              attachmentField={attachmentField}
            />
          ))}
        </div>
      )}
    </>
  );
}
