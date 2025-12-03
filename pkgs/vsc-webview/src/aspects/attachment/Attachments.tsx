import { Attachment } from "@wrkspc/core/attachment";
import { Button, textCn } from "@wrkspc/ds";
import { Field } from "enso";
import { LayoutBlock } from "../layout/Block";
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
    <LayoutBlock>
      {!!attachmentsField.size ? (
        attachmentsField.map((attachmentField) => (
          <AttachmentComponent
            key={attachmentField.id}
            attachmentField={attachmentField}
          />
        ))
      ) : (
        <p className={textCn()}>
          Attach files to include them in the test run.
        </p>
      )}

      <div>
        <Button size="xsmall" onClick={() => test.attachFile()}>
          Attach file
        </Button>
      </div>
    </LayoutBlock>
  );
}
