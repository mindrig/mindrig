import JsonView from "@uiw/react-json-view";

export namespace JsonPreview {
  export interface Props {
    value: object;
  }
}

export function JsonPreview(props: JsonPreview.Props) {
  const { value } = props;

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
