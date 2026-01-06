import {
  buildMapPromptId,
  buildMapPromptVarId,
  compilePlaygroundMapPromptDraft,
  PlaygroundMap,
  toPlaygroundMapPrompt,
} from "@wrkspc/core/playground";
import { assert, describe, expect, it } from "vitest";
import { parsePrompts } from "volumen";
import {
  playgroundMapPromptDraftFactoryV1,
  playgroundMapPromptFactoryV1,
  TEST_FILE_MISC_PARSED_RESULT,
  TEST_FILE_MISC_SOURCE,
} from "../playground/__tests__/factories";
import { promptInterpolateV1, promptInterpolateV2 } from "./interpolate";

describe(promptInterpolateV2, () => {
  it("interpolates vars into prompt", () => {
    const { varId, prompt } = interpolateFactorySingle();
    const result = promptInterpolateV2(prompt, { [varId]: "Sasha" });
    expect(result).toBe("Hello, Sasha!");
  });

  it("resolves var exp if value is not found", () => {
    const { prompt } = interpolateFactorySingle();
    const result = promptInterpolateV2(prompt, {});
    expect(result).toBe("Hello, ${name}!");
  });

  it("handles multiple variables", () => {
    const { varIds, prompt } = interpolateFactoryMultiple();
    const result = promptInterpolateV2(prompt, {
      [varIds[0]]: "Hola",
      [varIds[1]]: "Sasha",
    });
    expect(result).toBe("Hola, Sasha!");
  });

  it("integrates with parsed and mapped prompts", () => {
    const source = "const helloPrompt = `${greeting}, ${name}!`;";
    const parsed = parsePrompts(source, "template.ts");
    assert(parsed.state === "success");
    const parsedPrompt = parsed.prompts[0];
    assert(parsedPrompt);

    const mapPrompt = toPlaygroundMapPrompt({ source, prompt: parsedPrompt });

    const result = promptInterpolateV2(mapPrompt, {
      [mapPrompt.vars[0]!.id]: "Hola",
      [mapPrompt.vars[1]!.id]: "Sasha",
    });
    expect(result).toBe("Hola, Sasha!");
  });

  it("works with draft prompts", () => {
    const prompt = compilePlaygroundMapPromptDraft(
      "Dear {{title}} {{name}}, welcome!",
    );
    const result = promptInterpolateV2(prompt, {
      [prompt.vars[0]!.id]: "Dr.",
      [prompt.vars[1]!.id]: "Smith",
    });
    expect(result).toBe("Dear Dr. Smith, welcome!");
  });
});

describe(promptInterpolateV1, () => {
  it("interpolates vars into prompt", () => {
    const { varId, prompt } = promptInjectVarsFactoryV1();
    const result = promptInterpolateV1(prompt, { [varId]: "Sasha" });
    expect(result).toBe("Hello, Sasha!");
  });

  it("resolves var exp if value is not found", () => {
    const { prompt } = promptInjectVarsFactoryV1();
    const result = promptInterpolateV1(prompt, {});
    expect(result).toBe("Hello, {name}!");
  });

  it("handles multiple variables", () => {
    const varAId = buildMapPromptVarId();
    const varBId = buildMapPromptVarId();
    const { prompt } = promptInjectVarsFactoryV1({
      content: "{greeting}, {name}!",
      vars: [
        {
          v: 1,
          id: varAId,
          exp: "{greeting}",
          span: {
            v: 1,
            outer: {
              v: 1,
              start: 0,
              end: 10,
            },

            inner: {
              v: 1,
              start: 1,
              end: 9,
            },
          },
        },
        {
          v: 1,
          id: varBId,
          exp: "{name}",
          span: {
            v: 1,
            outer: {
              v: 1,
              start: 12,
              end: 18,
            },
            inner: {
              v: 1,
              start: 13,
              end: 17,
            },
          },
        },
      ],
    });
    const result = promptInterpolateV1(prompt, {
      [varAId]: "Hola",
      [varBId]: "Sasha",
    });
    expect(result).toBe("Hola, Sasha!");
  });

  it("integrates with parsed and mapped prompts", () => {
    const source = "const helloPrompt = `${greeting}, ${name}!`;";
    const parsed = parsePrompts(source, "template.ts");
    assert(parsed.state === "success");
    const parsedPrompt = parsed.prompts[0];
    assert(parsedPrompt);

    const mapPrompt: PlaygroundMap.Prompt = {
      v: 1,
      type: "code",
      id: buildMapPromptId(),
      content: source.slice(
        parsedPrompt.span.outer[0],
        parsedPrompt.span.outer[1],
      ),
      vars: parsedPrompt.content
        .filter((t) => t.type === "var")
        .map((vt) => {
          const parsedVar = parsedPrompt.vars[vt.index]!;
          const var_: PlaygroundMap.PromptVarV1 = {
            v: 1,
            id: buildMapPromptVarId(),
            exp: source.slice(parsedVar.span.outer[0], parsedVar.span.outer[1]),
            span: {
              v: 1,
              outer: {
                v: 1,
                start: parsedVar.span.outer[0] - parsedPrompt.span.outer[0],
                end: parsedVar.span.outer[1] - parsedPrompt.span.outer[0],
              },
              inner: {
                v: 1,
                start: parsedVar.span.inner[0] - parsedPrompt.span.outer[0],
                end: parsedVar.span.inner[1] - parsedPrompt.span.outer[0],
              },
            },
          };
          return var_;
        }),
      span: {
        v: 1,
        outer: {
          v: 1,
          start: parsedPrompt.span.outer[0],
          end: parsedPrompt.span.outer[1],
        },
        inner: {
          v: 1,
          start: parsedPrompt.span.inner[0],
          end: parsedPrompt.span.inner[1],
        },
      },
      updatedAt: Date.now(),
    };

    const result = promptInterpolateV1(mapPrompt, {
      [mapPrompt.vars[0]!.id]: "Hola",
      [mapPrompt.vars[1]!.id]: "Sasha",
    });
    expect(result).toBe("Hola, Sasha!");
  });

  it("works with draft prompts", () => {
    const var1Id = buildMapPromptVarId();
    const var2Id = buildMapPromptVarId();
    const prompt = playgroundMapPromptDraftFactoryV1({
      content: "Dear {{title}} {{name}}, welcome!",
      vars: [
        {
          v: 1,
          id: var1Id,
          exp: "{{title}}",
          span: {
            v: 1,
            outer: {
              v: 1,
              start: 5,
              end: 14,
            },
            inner: {
              v: 1,
              start: 7,
              end: 12,
            },
          },
        },
        {
          v: 1,
          id: var2Id,
          exp: "{{name}}",
          span: {
            v: 1,
            outer: {
              v: 1,
              start: 15,
              end: 23,
            },
            inner: {
              v: 1,
              start: 17,
              end: 21,
            },
          },
        },
      ],
    });
    const result = promptInterpolateV1(prompt, {
      [var1Id]: "Dr.",
      [var2Id]: "Smith",
    });
    expect(result).toBe("Dear Dr. Smith, welcome!");
  });
});

function interpolateFactorySingle(props: promptInjectVarsFactoryV1.Props = {}) {
  const prompt = toPlaygroundMapPrompt({
    source: TEST_FILE_MISC_SOURCE,
    prompt: TEST_FILE_MISC_PARSED_RESULT.prompts[0],
  });
  const varId = prompt.vars[0]!.id;
  return { varId, prompt };
}

function interpolateFactoryMultiple(
  props: promptInjectVarsFactoryV1.Props = {},
) {
  const prompt = toPlaygroundMapPrompt({
    source: TEST_FILE_MISC_SOURCE,
    prompt: TEST_FILE_MISC_PARSED_RESULT.prompts[1],
  });
  const varIds = [prompt.vars[0]!.id, prompt.vars[1]!.id] as const;
  return { varIds, prompt };
}

namespace promptInjectVarsFactoryV1 {
  export interface Props {
    content?: string;
    vars?: readonly PlaygroundMap.PromptVar[];
  }
}

function promptInjectVarsFactoryV1(
  props: promptInjectVarsFactoryV1.Props = {},
) {
  const { defaultVarId, defaultVar } = defaultVarFactory();
  const prompt = playgroundMapPromptFactoryV1({
    vars: (props.vars || [defaultVar]).map(normalizeVarToV1),
    content: props.content ?? "Hello, {name}!",
  });
  return { varId: defaultVarId, prompt };
}

function normalizeVarToV1(
  var_: PlaygroundMap.PromptVar,
): PlaygroundMap.PromptVarV1 {
  if (var_.v === 1) return var_;
  const span: PlaygroundMap.SpanShape = {
    v: 1,
    outer: {
      v: 1,
      start: var_.span.outer[0],
      end: var_.span.outer[1],
    },
    inner: {
      v: 1,
      start: var_.span.inner[0],
      end: var_.span.inner[1],
    },
  };
  const exp = var_.content.outer;
  const varV1: PlaygroundMap.PromptVarV1 = {
    v: 1,
    id: var_.id,
    exp,
    span,
  };
  return varV1;
}

function defaultVarFactory() {
  const defaultVarId = buildMapPromptVarId();
  const defaultVar: PlaygroundMap.PromptVarV2 = {
    v: 2,
    id: defaultVarId,
    content: { v: 2, outer: "{name}", inner: "name" },
    span: {
      v: 2,
      outer: [7, 13],
      inner: [8, 12],
    },
  };
  return { defaultVarId, defaultVar };
}
