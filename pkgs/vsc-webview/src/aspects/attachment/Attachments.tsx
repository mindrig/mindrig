import { Attachment } from "@wrkspc/core/attachment";
import { Button } from "@wrkspc/ds";
import iconRegularPaperclip from "@wrkspc/icons/svg/regular/paperclip.js";
import iconRegularPlus from "@wrkspc/icons/svg/regular/plus.js";
import { Field } from "enso";
import { LayoutSection } from "../layout/Section";
import { useTest } from "../test/Context";
import { AttachmentComponent } from "./Attachment";

export namespace Attachments {
  export interface Props {
    attachmentsField: Field<Attachment[]>;
  }
}

export function Attachments(props: Attachments.Props) {
  const { test } = useTest();
  const attachmentsField = props.attachmentsField.useCollection();

  return (
    <LayoutSection
      header="Attachments"
      icon={iconRegularPaperclip}
      actions={
        <Button
          style="label"
          color="secondary"
          icon={iconRegularPlus}
          size="xsmall"
          onClick={() => test.attachFile()}
        >
          Attach file
        </Button>
      }
    >
      {!!attachmentsField.size &&
        attachmentsField.map((attachmentField) => (
          <AttachmentComponent
            key={attachmentField.id}
            attachmentField={attachmentField}
          />
        ))}
    </LayoutSection>
  );
}
