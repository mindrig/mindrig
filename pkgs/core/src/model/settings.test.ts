import { describe, expect, it } from "vitest";
import {
  ModelSettings,
  sanitizeModelSettings,
  sanitizeModelSettingsValue,
} from "./settings";

describe(sanitizeModelSettings, () => {
  it("sanitizes model settings by removing nullish and internal fields", () => {
    const settings: ModelSettings = {
      v: 1,
      type: "language",
      maxOutputTokens: NaN,
      temperature: 0.7,
      topP: 0.9,
      topK: null,
      presencePenalty: 0.5,
      frequencyPenalty: NaN,
      stopSequences: ["", "end", "   "],
      seed: undefined,
      reasoning: { enabled: true, effort: "high", budgetTokens: NaN },
    };

    expect(sanitizeModelSettings(settings)).toEqual({
      v: 1,
      type: "language",
      temperature: 0.7,
      topP: 0.9,
      presencePenalty: 0.5,
      stopSequences: ["end"],
      reasoning: { enabled: true, effort: "high" },
    });
  });
});

describe(sanitizeModelSettingsValue, () => {
  it("sanitizes string values", () => {
    expect(sanitizeModelSettingsValue("  ")).toBeNull();
    expect(sanitizeModelSettingsValue("hello")).toBe("hello");
  });

  it("sanitizes number values", () => {
    expect(sanitizeModelSettingsValue(42)).toBe(42);
    expect(sanitizeModelSettingsValue(NaN)).toBeNull();
  });

  it("sanitizes array values", () => {
    expect(sanitizeModelSettingsValue(["  ", "world", null, ""])).toEqual([
      "world",
    ]);
    expect(sanitizeModelSettingsValue([null, undefined, "   "])).toBeNull();
  });

  it("sanitizes object values", () => {
    expect(
      sanitizeModelSettingsValue({
        a: "  ",
        b: "value",
        c: null,
        d: 0,
      }),
    ).toEqual({ b: "value", d: 0 });

    expect(
      sanitizeModelSettingsValue({
        x: null,
        y: undefined,
        z: "   ",
      }),
    ).toBeNull();
  });

  it("returns null for nullish values", () => {
    expect(sanitizeModelSettingsValue(null)).toBeNull();
    expect(sanitizeModelSettingsValue(undefined)).toBeNull();
  });
});
