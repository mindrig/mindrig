import { PromptVar } from "@mindrig/types";
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

    const prompt = {
      exp: "Hello ${name}, you are ${age} years old.",
      span: {
        outer: { start: 0, end: 0 },
        inner: { start: 0, end: 0 },
      },
      vars: promptVars,
      file: "file1",
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
          outer: { start: 12, end: 14 },
          inner: { start: 0, end: 0 },
        },
      },
      {
        exp: "${age}",
        span: {
          outer: { start: 16, end: 18 },
          inner: { start: 0, end: 0 },
        },
      },
    ];

    const prompt = {
      exp: "Hello ${name}, you are ${age} years old.",
      span: {
        outer: { start: 8, end: 22 },
        inner: { start: 10, end: 20 },
      },
      vars: promptVars,
      file: "file1",
    };

    const result = playgroundMapVarsFromPrompt(prompt);

    expect(result).toEqual([
      {
        v: 1,
        id: expect.any(String),
        exp: "${name}",
        span: { v: 1, start: 2, end: 4 },
      },
      {
        v: 1,
        id: expect.any(String),
        exp: "${age}",
        span: { v: 1, start: 6, end: 8 },
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
