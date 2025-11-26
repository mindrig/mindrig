import { Tool } from "@wrkspc/core/tool";
import { Field } from "enso";
import { ToolComponent } from "./Tool";

export namespace Tools {
  export interface Props {
    toolsField: Field<Tool[]>;
  }
}

export function Tools(props: Tools.Props) {
  const toolsField = props.toolsField.useCollection();

  return (
    <div>
      {toolsField.map((toolField) => (
        <ToolComponent key={toolField.key} toolsField={toolField} />
      ))}
    </div>
  );
}
