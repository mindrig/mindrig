import { Prompt, PromptVar } from "@mindrig/types";
import { describe, expect, it } from "vitest";
import {
  playgroundMapVarFromPromptVar,
  playgroundMapVarsFromPrompt,
} from "./map";

describe(playgroundMapVarsFromPrompt, () => {
  it("converts Prompt vars to PlaygroundMap.PromptVars", () => {
    const promptVars: PromptVar[] = [
      {
        exp: "${name}",
        span: {
          outer: { start: 0, end: 0 },
          inner: { start: 0, end: 0 },
        },
      },
      {
        exp: "${age}",
        span: {
          outer: { start: 0, end: 0 },
          inner: { start: 0, end: 0 },
        },
      },
    ];

    const prompt: Prompt = {
      exp: "`Hello ${name}, you are ${age} years old.`",
      vars: promptVars,
      file: "template.ts",
      span: {
        outer: { start: 0, end: 0 },
        inner: { start: 0, end: 0 },
      },
    };

    const result = playgroundMapVarsFromPrompt(prompt);

    expect(result).toEqual([
      {
        v: 1,
        id: expect.any(String),
        exp: "${name}",
        span: { v: 1, start: 0, end: 0 },
      },
      {
        v: 1,
        id: expect.any(String),
        exp: "${age}",
        span: { v: 1, start: 0, end: 0 },
      },
    ]);
  });

  it("transposes var spans to inner prompt span", () => {
    const promptVars: PromptVar[] = [
      {
        exp: "${name}",
        span: {
          outer: { start: 27, end: 34 },
          inner: { start: 29, end: 33 },
        },
      },
      {
        exp: "${age}",
        span: {
          outer: { start: 44, end: 50 },
          inner: { start: 46, end: 49 },
        },
      },
    ];

    const prompt: Prompt = {
      exp: "`Hello ${name}, you are ${age} years old.`",
      vars: promptVars,
      file: "template.ts",
      span: {
        outer: { start: 20, end: 62 },
        inner: { start: 21, end: 61 },
      },
    };

    const result = playgroundMapVarsFromPrompt(prompt);
    expect(result).toEqual([
      {
        v: 1,
        id: expect.any(String),
        exp: "${name}",
        span: { v: 1, start: 7, end: 14 },
      },
      {
        v: 1,
        id: expect.any(String),
        exp: "${age}",
        span: { v: 1, start: 24, end: 30 },
      },
    ]);
  });
});

describe(playgroundMapVarFromPromptVar, () => {
  it("converts PromptVar to PlaygroundMap.PromptVar", () => {
    const promptVar: PromptVar = {
      exp: "${name}",
      span: {
        outer: { start: 0, end: 0 },
        inner: { start: 0, end: 0 },
      },
    };

    const result = playgroundMapVarFromPromptVar(promptVar, {
      start: 0,
      end: 0,
    });

    expect(result).toEqual({
      v: 1,
      id: expect.any(String),
      exp: "${name}",
      span: { v: 1, start: 0, end: 0 },
    });
  });

  it("transposes span to content correctly", () => {
    const promptVar: PromptVar = {
      exp: "${name}",
      span: {
        outer: { start: 10, end: 20 },
        inner: { start: 0, end: 0 },
      },
    };

    const result = playgroundMapVarFromPromptVar(promptVar, {
      start: 5,
      end: 25,
    });

    expect(result).toEqual({
      v: 1,
      id: expect.any(String),
      exp: "${name}",
      span: { v: 1, start: 5, end: 15 },
    });
  });
});
