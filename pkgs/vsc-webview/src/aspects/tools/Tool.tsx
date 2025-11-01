import { Tool } from "@wrkspc/core/tool";
import { Field } from "enso";

export { ToolComponent as Tool };

export namespace ToolComponent {
  export interface Props {
    field: Field<Tool>;
  }
}

export function ToolComponent(props: ToolComponent.Props) {
  const { field } = props;

  return <div>TODO</div>;
}

// <label className="text-xs">
//   Tools (JSON)
//   <textarea
//     className="mt-1 w-full px-2 py-1 border rounded text-xs font-mono"
//     rows={3}
//     value={config.toolsJson}
//     onChange={(event) => onToolsJsonChange(event.target.value)}
//     placeholder="null"
//   />
//   {errors.tools && <span className="text-xs">{errors.tools}</span>}
// </label>;
