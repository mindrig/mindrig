import { parsePrompts } from "@mindrig/parser-wasm";
import {
  buildMapPromptId,
  buildMapPromptVarId,
  PlaygroundMap,
  playgroundMapSpanFromPrompt,
  playgroundMapVarsFromPrompt,
} from "@wrkspc/core/playground";
import { assert, describe, expect, it } from "vitest";
import { playgroundMapPromptFactory } from "../playground/__tests__/factories";
import { promptInterpolate } from "./interpolate";

describe(promptInterpolate, () => {
  it("interpolates vars into prompt", () => {
    const { varId, prompt } = promptInjectVarsFactory();
    const result = promptInterpolate(prompt, { [varId]: "Sasha" });
    expect(result).toBe("Hello, Sasha!");
  });

  it("resolves var exp if value is not found", () => {
    const { prompt } = promptInjectVarsFactory();
    const result = promptInterpolate(prompt, {});
    expect(result).toBe("Hello, {name}!");
  });

  it("handles multiple variables", () => {
    const varAId = buildMapPromptVarId();
    const varBId = buildMapPromptVarId();
    const { prompt } = promptInjectVarsFactory({
      content: "{greeting}, {name}!",
      vars: [
        {
          v: 1,
          id: varAId,
          exp: "{greeting}",
          span: {
            v: 1,
            start: 0,
            end: 10,
          },
        },
        {
          v: 1,
          id: varBId,
          exp: "{name}",
          span: {
            v: 1,
            start: 12,
            end: 18,
          },
        },
      ],
    });
    const result = promptInterpolate(prompt, {
      [varAId]: "Hola",
      [varBId]: "Sasha",
    });
    expect(result).toBe("Hola, Sasha!");
  });

  it("integrates with parsed and mapped prompts", () => {
    const parsed = parsePrompts(
      "const helloPrompt = `${greeting}, ${name}!`;",
      "template.ts",
    );
    assert(parsed.state === "success");
    const parsedPrompt = parsed.prompts[0];
    assert(parsedPrompt);

    const mapPrompt: PlaygroundMap.Prompt = {
      v: 1,
      id: buildMapPromptId(),
      content: parsedPrompt.exp,
      vars: playgroundMapVarsFromPrompt(parsedPrompt),
      span: playgroundMapSpanFromPrompt(parsedPrompt),
      updatedAt: Date.now(),
    };

    const result = promptInterpolate(mapPrompt, {
      [mapPrompt.vars[0]!.id]: "Hola",
      [mapPrompt.vars[1]!.id]: "Sasha",
    });
    expect(result).toBe("Hola, Sasha!");
  });
});

namespace promptInjectVarsFactory {
  export interface Props {
    content?: string;
    vars?: readonly PlaygroundMap.PromptVarV1[];
  }
}

function promptInjectVarsFactory(props: promptInjectVarsFactory.Props = {}) {
  const varId = buildMapPromptVarId();
  const prompt = playgroundMapPromptFactory({
    vars: props.vars || [
      {
        v: 1,
        id: varId,
        exp: "{name}",
        span: {
          v: 1,
          start: 7,
          end: 13,
        },
      },
    ],
    content: props.content ?? "Hello, {name}!",
  });

  return { varId, prompt };
}
