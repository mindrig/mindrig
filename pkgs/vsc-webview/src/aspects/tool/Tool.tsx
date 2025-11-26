import { Tool } from "@wrkspc/core/tool";
import { Field } from "enso";

export { ToolComponent as Tool };

export namespace ToolComponent {
  export interface Props {
    toolsField: Field<Tool>;
  }
}

export function ToolComponent(props: ToolComponent.Props) {
  const { toolsField } = props;
  // TODO: Implement tools editor
  return null;
}
