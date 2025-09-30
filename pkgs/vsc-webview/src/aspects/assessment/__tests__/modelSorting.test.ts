import { describe, expect, it } from "vitest";
import {
  OFFLINE_MODEL_RECOMMENDATIONS,
  compareProviderModelEntries,
  computeRecommendationWeightsForProvider,
  type ProviderModelWithScore,
} from "../modelSorting";

describe("computeRecommendationWeightsForProvider", () => {
  it("assigns dynamic weights to the newest models", () => {
    const entries = [
      { id: "model-old", name: "Old", lastUpdatedMs: Date.parse("2025-05-01") },
      { id: "model-new", name: "New", lastUpdatedMs: Date.parse("2025-08-20") },
      { id: "model-mid", name: "Mid", lastUpdatedMs: Date.parse("2025-07-10") },
    ];

    const weights = computeRecommendationWeightsForProvider("openai", entries, {
      modelsDevFallback: false,
    });

    expect(weights).toEqual({
      "model-new": 100,
      "model-mid": 95,
      "model-old": 90,
    });
  });

  it("falls back to offline recommendations when models.dev data is unavailable", () => {
    const entries = [
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", lastUpdatedMs: 0 },
    ];

    const weights = computeRecommendationWeightsForProvider("openai", entries, {
      modelsDevFallback: true,
    });

    expect(weights).toEqual(OFFLINE_MODEL_RECOMMENDATIONS.openai);
  });

  it("falls back when timestamps are missing", () => {
    const entries = [
      { id: "gemini-2.0-flash", name: "Gemini", lastUpdatedMs: 0 },
      { id: "gemini-1.5-pro", name: "Gemini Pro", lastUpdatedMs: 0 },
    ];

    const weights = computeRecommendationWeightsForProvider("google", entries, {
      modelsDevFallback: false,
    });

    expect(weights).toEqual(OFFLINE_MODEL_RECOMMENDATIONS.google);
  });
});

describe("compareProviderModelEntries", () => {
  const baseline: ProviderModelWithScore = {
    id: "baseline",
    name: "Baseline",
    lastUpdatedMs: Date.parse("2025-07-01"),
    recommendationScore: 90,
  };

  it("prefers newer timestamps", () => {
    const newer: ProviderModelWithScore = {
      id: "newer",
      name: "Newer",
      lastUpdatedMs: Date.parse("2025-08-01"),
      recommendationScore: 0,
    };

    expect(compareProviderModelEntries(newer, baseline)).toBeLessThan(0);
    expect(compareProviderModelEntries(baseline, newer)).toBeGreaterThan(0);
  });

  it("breaks ties with recommendation scores", () => {
    const sameTime = Date.parse("2025-08-01");
    const higherScore: ProviderModelWithScore = {
      id: "higher",
      name: "Higher",
      lastUpdatedMs: sameTime,
      recommendationScore: 95,
    };
    const lowerScore: ProviderModelWithScore = {
      id: "lower",
      name: "Lower",
      lastUpdatedMs: sameTime,
      recommendationScore: 80,
    };

    expect(compareProviderModelEntries(higherScore, lowerScore)).toBeLessThan(
      0,
    );
    expect(
      compareProviderModelEntries(lowerScore, higherScore),
    ).toBeGreaterThan(0);
  });

  it("falls back to lexical ordering", () => {
    const a: ProviderModelWithScore = {
      id: "a",
      name: "Alpha",
      lastUpdatedMs: 0,
      recommendationScore: 0,
    };
    const b: ProviderModelWithScore = {
      id: "b",
      name: "Beta",
      lastUpdatedMs: 0,
      recommendationScore: 0,
    };

    expect(compareProviderModelEntries(a, b)).toBeLessThan(0);
    expect(compareProviderModelEntries(b, a)).toBeGreaterThan(0);
  });
});
