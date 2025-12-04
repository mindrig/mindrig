import { ModelLanguage } from "@wrkspc/core/model";
import { Tabs } from "@wrkspc/ds";
import { State } from "enso";
import { useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import { JsonPreview } from "../json/Preview";
import { ResultContentLayout } from "../result/ContentLayout";

export namespace ModelLanguageContent {
  export interface Props {
    state: State<ModelLanguage.Content>;
  }
}

export function ModelLanguageContent(props: ModelLanguageContent.Props) {
  const { state } = props;
  const [showRaw, setShowRaw] = useState(false);

  const text = state.useCompute(
    (content) =>
      content.type === "text" ? content.text : content.parts.join(""),
    [],
  );

  const parsedJson = useMemo<object | null | undefined>(() => {
    try {
      return JSON.parse(text);
    } catch {}
  }, [text]);

  return (
    <ResultContentLayout
      nav={
        <Tabs
          size="xsmall"
          onChange={(id) => setShowRaw(id === "raw")}
          items={[
            { label: parsedJson ? "JSON" : "Markdown", id: "rendered" },
            { label: "Raw", id: "raw" },
          ]}
        />
      }
    >
      {showRaw ? (
        <pre className="font-mono text-sm whitespace-pre-wrap">{text}</pre>
      ) : parsedJson ? (
        <JsonPreview value={parsedJson} />
      ) : (
        <Streamdown>{text}</Streamdown>
      )}
    </ResultContentLayout>
  );
}
