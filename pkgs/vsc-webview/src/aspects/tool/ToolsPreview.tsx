import { Tool } from "@wrkspc/core/tool";

export namespace ToolsPreview {
  export interface Props {
    tools: Tool[];
  }
}

export function ToolsPreview(props: ToolsPreview.Props) {
  const { tools } = props;

  return (
    <div>
      <div>TODO</div>
    </div>
  );
}
