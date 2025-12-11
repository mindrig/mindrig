import { Datasource } from "@wrkspc/core/datasource";
import { PlaygroundMap } from "@wrkspc/core/playground";

export function promptInterpolate(
  prompt: PlaygroundMap.Prompt,
  values: Datasource.Values,
): string {
  const newVars = [...prompt.vars];
  newVars.reverse();
  const { outer, inner } =
    "span" in prompt
      ? prompt.span
      : {
          outer: { v: 1, start: 0, end: prompt.content.length },
          inner: { v: 1, start: 0, end: prompt.content.length },
        };
  const contentEnd = prompt.content.length - (outer.end - inner.end);
  let result = prompt.content.slice(0, contentEnd);
  for (const vr of newVars) {
    result =
      result.slice(0, vr.span.outer.start) +
      (values[vr.id] ?? vr.exp) +
      result.slice(vr.span.outer.end);
  }
  const contentStart = inner.start - outer.start;
  result = result.slice(contentStart);
  return result;
}
