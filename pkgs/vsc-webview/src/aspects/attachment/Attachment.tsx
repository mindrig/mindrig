import { Attachment } from "@wrkspc/core/attachment";
import { Field } from "enso";

export { AttachmentComponent as Attachment };

export namespace AttachmentComponent {
  export interface Props {
    field: Field<Attachment, "detachable">;
  }
}

export function AttachmentComponent(props: AttachmentComponent.Props) {
  const { field } = props;
  return <div>TODO</div>;
}
