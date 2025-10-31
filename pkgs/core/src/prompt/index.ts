import type { Prompt, PromptVar } from "@mindrig/types";

export * from "./argument.js";
export * from "./message.js";
export * from "./parse.js";

export function extractPromptText(
  fileContent: string | undefined | null,
  prompt: Prompt,
): string {
  if (!fileContent) return prompt.exp;
  try {
    const s = prompt.span.inner.start;
    const e = prompt.span.inner.end;
    if (e > s && e <= fileContent.length) return fileContent.slice(s, e);
  } catch {}
  return prompt.exp;
}

export function substituteVariables(
  baseText: string,
  prompt: Prompt,
  vars: Record<string, string>,
): string {
  if (!prompt?.vars || prompt.vars.length === 0) return baseText;
  const innerStart = prompt.span.inner.start;
  const sorted = [...prompt.vars].sort(
    (a, b) => (b.span.outer.start || 0) - (a.span.outer.start || 0),
  );
  let result = baseText;
  for (const v of sorted) {
    const value = vars[v.exp] || "";
    const start = Math.max(0, (v.span.outer.start ?? 0) - innerStart);
    const end = Math.max(start, (v.span.outer.end ?? 0) - innerStart);
    result = result.slice(0, start) + value + result.slice(end);
  }
  return result;
}

export function findPromptAtCursor(
  prompts: Prompt[],
  cursorOffset: number | undefined,
): [number, Prompt] | [] {
  if (!cursorOffset) return [];
  for (let idx = 0; idx < prompts.length; idx++) {
    const prompt = prompts[idx];
    if (
      prompt &&
      cursorOffset >= prompt.span.outer.start &&
      cursorOffset <= prompt.span.outer.end
    ) {
      return [idx, prompt];
    }
  }
  return [];
}

export function variableIndexByHeader(
  headers: string[] | null,
  variable: PromptVar,
): number {
  if (!headers) return -1;
  return headers.indexOf(variable.exp);
}
