import { Tool } from "@wrkspc/core/tool";
import { Field } from "enso";
import { ToolComponent } from "./Tool";

export namespace Tools {
  export interface Props {
    field: Field<Tool[]>;
  }
}

export function Tools(props: Tools.Props) {
  const field = props.field.useCollection();

  return (
    <div className="space-y-3">
      {field.map((toolField) => (
        <ToolComponent key={toolField.key} field={toolField} />
      ))}
    </div>
  );
}
