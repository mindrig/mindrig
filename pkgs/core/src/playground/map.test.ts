import { Prompt } from "@volumen/types";
import { describe, expect, it } from "vitest";
import { playgroundMapVarsFromPrompt, toPlaygroundMapVar } from "./map";

describe(playgroundMapVarsFromPrompt, () => {
  it("converts Prompt vars to PlaygroundMap.PromptVars", () => {
    const result = playgroundMapVarsFromPrompt(sourceA, promptABeta);

    expect(result).toEqual([
      {
        v: 2,
        id: expect.any(String),
        content: {
          v: 2,
          outer: "${two}",
          inner: "two",
        },
        span: { v: 2, ...promptABeta.vars[0].span },
      },
      {
        v: 2,
        id: expect.any(String),
        content: {
          v: 2,
          outer: "${one}",
          inner: "one",
        },
        span: { v: 2, ...promptABeta.vars[1].span },
      },
    ]);
  });
});

describe(toPlaygroundMapVar, () => {
  it("converts PromptVar to PlaygroundMap.PromptVar", () => {
    const promptVar = promptABeta.vars[1];
    const result = toPlaygroundMapVar(sourceA, promptVar);

    expect(result).toEqual({
      v: 2,
      id: expect.any(String),
      span: { v: 2, ...promptVar.span },
      content: {
        v: 2,
        outer: "${one}",
        inner: "one",
      },
    });
  });
});

const sourceA = `const one = 1;
const two = 2;
const alphaPrompt = \`alpha: \${one}\`;
const betaPrompt = \`beta: \${two}, \${one}\`;
`;

const promptABeta = {
  file: "testA.ts",
  enclosure: [67, 109],
  span: {
    outer: [86, 108],
    inner: [87, 107],
  },
  content: [
    {
      type: "str",
      span: [87, 93],
    },
    {
      type: "var",
      span: [93, 99],
      index: 0,
    },
    {
      type: "str",
      span: [99, 101],
    },
    {
      type: "var",
      span: [101, 107],
      index: 1,
    },
  ],
  joint: {
    outer: [0, 0],
    inner: [0, 0],
  },
  vars: [
    {
      span: {
        outer: [93, 99],
        inner: [95, 98],
      },
    },
    {
      span: {
        outer: [101, 107],
        inner: [103, 106],
      },
    },
  ] as const,
  annotations: [],
} satisfies Prompt;
