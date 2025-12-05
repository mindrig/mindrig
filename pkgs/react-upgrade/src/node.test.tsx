import { describe, expect, it } from "vitest";
import { isReactElement } from "./node.js";

describe(isReactElement, () => {
  it("detects React elements", () => {
    expect(isReactElement(<div />)).toBe(true);
    const Component = () => <p>Hello!</p>;
    expect(isReactElement(<Component />)).toBe(true);

    expect(isReactElement([<div />])).toBe(false);
    expect(isReactElement({ div: <div /> })).toBe(false);
    expect(isReactElement("string")).toBe(false);
    expect(isReactElement(123)).toBe(false);
    expect(isReactElement(null)).toBe(false);
    expect(isReactElement(undefined)).toBe(false);
    expect(isReactElement({})).toBe(false);
  });
});
