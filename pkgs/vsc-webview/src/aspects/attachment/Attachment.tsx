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

// const key = attachment.path || attachment.name;
// const approximateSize =
//   typeof attachment.base64 === "string"
//     ? Math.round((attachment.base64.length * 3) / 4 / 1024)
//     : null;
// return (
//   <div key={key} className="flex items-center gap-2">
//     <span className="font-medium">{attachment.name}</span>
//     {approximateSize !== null && (
//       <span className="text-neutral-500">{approximateSize} KB</span>
//     )}
//   </div>
// );
