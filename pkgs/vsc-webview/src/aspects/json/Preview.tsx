import JsonView from "@uiw/react-json-view";

export namespace JsonPreview {
  export interface Props {
    value: object;
  }
}

export function JsonPreview(props: JsonPreview.Props) {
  const { value } = props;

  // TODO: Use Shiki here instead of JsonView, as Streamdown also uses Shiki
  // and given that we can't actually inherit VS Code theme in the webview, at
  // least having consistent syntax highlighting would be good. Also JsonView
  // has some extra features we don't need, like clipboard support.

  return (
    <div className="p-3 overflow-x-auto bg-editor-canvas">
      <JsonView
        value={value}
        indentWidth={10}
        displayObjectSize={false}
        displayDataTypes={false}
        enableClipboard={false}
        highlightUpdates={false}
      />
    </div>
  );
}
