import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { Streamdown, type StreamdownProps } from "streamdown";

interface StreamingMarkdownProps
  extends Omit<StreamdownProps, "children"> {
  text?: string | null;
  textParts?: string[];
  runId?: string | null;
  resultId?: string | null;
  streaming?: boolean;
  wrapperClassName?: string;
  emptyPlaceholder?: ReactNode;
  onRawChange?: (markdown: string) => void;
}

const defaultPlaceholder = (
  <div className="text-xs text-neutral-500">No content yet.</div>
);

/**
 * StreamingMarkdown renders incremental markdown output using Streamdown while
 * allowing callers to observe the raw markdown and supply a placeholder until
 * the first tokens arrive.
 */
export function StreamingMarkdown({
  text,
  textParts,
  runId,
  resultId,
  streaming = true,
  wrapperClassName,
  emptyPlaceholder,
  onRawChange,
  className,
  allowedImagePrefixes,
  allowedLinkPrefixes,
  defaultOrigin: incomingDefaultOrigin,
  controls,
  ...streamdownProps
}: StreamingMarkdownProps) {
  const latestContent = useMemo(() => {
    if (typeof text === "string" && text.length > 0) return text;
    if (Array.isArray(textParts) && textParts.length > 0)
      return textParts.join("");
    return "";
  }, [text, textParts]);

  const streamKey = useMemo(() => {
    const normalizedRun = runId ?? "";
    const normalizedResult = resultId ?? "";
    return `${normalizedRun}::${normalizedResult}`;
  }, [runId, resultId]);

  useEffect(() => {
    if (latestContent !== undefined && onRawChange)
      onRawChange(latestContent);
  }, [latestContent, onRawChange]);

  const defaultOrigin = useMemo(() => {
    if (incomingDefaultOrigin) return incomingDefaultOrigin;
    if (typeof window === "undefined") return "https://mindrig.invalid";
    return window.location.origin;
  }, [incomingDefaultOrigin]);

  const hasContent = latestContent.length > 0;
  const placeholder = emptyPlaceholder ?? defaultPlaceholder;

  return (
    <div className={wrapperClassName}>
      {hasContent ? (
        <Streamdown
          key={streamKey}
          className={className}
          allowedImagePrefixes={allowedImagePrefixes}
          allowedLinkPrefixes={allowedLinkPrefixes}
          defaultOrigin={defaultOrigin}
          controls={controls ?? false}
          {...streamdownProps}
        >
          {latestContent}
        </Streamdown>
      ) : streaming ? (
        placeholder
      ) : null}
    </div>
  );
}
