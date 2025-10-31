import JsonView from "@uiw/react-json-view";

import { StreamingMarkdown } from "@/aspects/assessment/components/StreamingMarkdown";
import type { RunResult } from "@/aspects/assessment/types";

import { shouldExpandNodeInitially } from "./jsonUtils";
import { RunResultMessage } from "./Message";

export namespace RunResultMessages {
  export interface Props {
    result: RunResult;
    isLoading: boolean;
    view: "rendered" | "raw";
    onViewChange: (view: "rendered" | "raw") => void;
  }
}

export function RunResultMessages(props: RunResultMessages.Props) {
  const { result, isLoading, view, onViewChange } = props;

  const rawText = result.text ?? "";
  const textParts = result.textParts ?? [];
  const assembledText = rawText.length > 0 ? rawText : textParts.join("");
  const hasContent = assembledText.length > 0;

  let parsedTextJson: object | null = null;
  const trimmedText = assembledText.trim();
  if (trimmedText.startsWith("{") || trimmedText.startsWith("["))
    try {
      const parsed = JSON.parse(trimmedText);
      if (parsed && typeof parsed === "object") parsedTextJson = parsed;
    } catch (error) {
      parsedTextJson = null;
    }

  const renderedLabel = parsedTextJson ? "JSON" : "Rendered";
  const placeholderCopy = isLoading ? "Waiting for output…" : "No output yet.";

  const renderedContent = parsedTextJson ? (
    <div className="overflow-auto">
      <JsonView
        value={parsedTextJson}
        displayObjectSize={false}
        shouldExpandNodeInitially={shouldExpandNodeInitially}
      />
    </div>
  ) : (
    <StreamingMarkdown
      text={rawText}
      textParts={textParts}
      runId={result.runId ?? null}
      resultId={result.resultId ?? null}
      streaming={Boolean(result.streaming) || isLoading || !hasContent}
      wrapperClassName="streamdown-content prose prose-sm max-w-none"
      emptyPlaceholder={
        <div className="text-xs text-neutral-500">{placeholderCopy}</div>
      }
      allowedLinkPrefixes={["https://", "http://", "mailto:"]}
      allowedImagePrefixes={["https://", "http://"]}
    />
  );

  const rawContent = hasContent ? (
    <pre className="text-xs whitespace-pre-wrap overflow-x-auto">
      {assembledText}
    </pre>
  ) : (
    <div className="text-xs text-neutral-500">{placeholderCopy}</div>
  );

  return (
    <RunResultMessage
      label="Response"
      renderedLabel={renderedLabel}
      currentView={view}
      renderedContent={renderedContent}
      rawContent={rawContent}
      onChangeView={onViewChange}
    />
  );
}
