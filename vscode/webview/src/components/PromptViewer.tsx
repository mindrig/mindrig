import type { Prompt } from "@mindcontrol/code-types";

export namespace PromptViewer {
  export interface Props {
    prompt: Prompt | null;
    fileContent?: string | null;
  }
}

export function PromptViewer({ prompt, fileContent }: PromptViewer.Props) {
  if (!prompt) return null;

  const text = (() => {
    if (!fileContent) return prompt.exp;
    try {
      const start = prompt.span?.inner?.start ?? 0;
      const end = prompt.span?.inner?.end ?? 0;
      if (end > start && end <= fileContent.length) {
        return fileContent.slice(start, end);
      }
    } catch {}
    return prompt.exp;
  })();

  return (
    <div className="bg-white rounded-lg border border-gray-100">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-700">Current Prompt</h4>
      </div>
      <div className="p-4">
        <textarea
          className="w-full h-32 p-3 border border-gray-300 rounded bg-gray-50 text-gray-900 text-xs font-mono resize-none focus:outline-none"
          value={text}
          readOnly
          placeholder="No prompt selected"
        />
      </div>
    </div>
  );
}
