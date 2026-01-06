import { Datasource } from "@wrkspc/core/datasource";
import { PlaygroundMap } from "@wrkspc/core/playground";
import { always } from "alwaysly";

export function promptInterpolate(
  prompt: PlaygroundMap.Prompt,
  values: Datasource.Values,
): string {
  switch (prompt.v) {
    case 2:
      return promptInterpolateV2(prompt, values);
    case 1:
    case undefined:
      return promptInterpolateV1(prompt, values);
  }
}

export function promptInterpolateV2(
  prompt: PlaygroundMap.PromptV2,
  values: Datasource.Values,
): string {
  return prompt.tokens.reduce((acc, token) => {
    switch (token.type) {
      case "str":
        return acc + token.content;

      case "var": {
        const var_ = prompt.vars[token.index];
        always(var_);
        const value = values[var_.id] || var_.content.outer;
        return acc + value;
      }

      case "joint":
        return acc + prompt.joint.content;
    }
  }, "");
}

export function promptInterpolateV1(
  prompt: PlaygroundMap.PromptV1,
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
