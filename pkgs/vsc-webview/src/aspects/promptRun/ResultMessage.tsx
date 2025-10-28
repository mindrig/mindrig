import type { ReactNode } from "react";

export interface ResultMessageProps {
  label: string;
  renderedLabel: string;
  currentView: "rendered" | "raw";
  renderedContent: ReactNode;
  rawContent: ReactNode;
  onChangeView: (view: "rendered" | "raw") => void;
}

export function PromptRunResultMessage(props: ResultMessageProps) {
  const {
    label,
    renderedLabel,
    currentView,
    renderedContent,
    rawContent,
    onChangeView,
  } = props;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium">{label}</span>
        <button
          type="button"
          className={`px-2 py-1 border rounded ${currentView === "rendered" ? "font-semibold" : ""}`}
          onClick={() => onChangeView("rendered")}
        >
          {renderedLabel}
        </button>

        <button
          type="button"
          className={`px-2 py-1 border rounded ${currentView === "raw" ? "font-semibold" : ""}`}
          onClick={() => onChangeView("raw")}
        >
          Raw
        </button>
      </div>

      <div className="p-3 rounded border">
        {currentView === "rendered" ? renderedContent : rawContent}
      </div>
    </div>
  );
}
