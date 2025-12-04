import { Attachment } from "@wrkspc/core/attachment";
import { Block, Button, textCn } from "@wrkspc/ds";
import { Field } from "enso";
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
    <Block pad border={[false, true, true]} dir="y">
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
    </Block>
  );
}
