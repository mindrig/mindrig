import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import { applyCodeChanges, computeTextChanges } from "./code";

describe(computeTextChanges, () => {
  it("returns empty array for identical strings", () => {
    expect(computeTextChanges("hello", "hello")).toEqual([]);
  });

  it("returns empty array for empty strings", () => {
    expect(computeTextChanges("", "")).toEqual([]);
  });

  it("handles insertion at start", () => {
    const result = computeTextChanges("world", "hello world");
    expect(result).toEqual([
      {
        start: 0,
        delete: 0,
        insert: "hello ",
      },
    ]);
  });

  it("handles insertion at end", () => {
    const result = computeTextChanges("hello", "hello world");
    expect(result).toEqual([
      {
        start: 5,
        delete: 0,
        insert: " world",
      },
    ]);
  });

  it("handles insertion in middle", () => {
    const result = computeTextChanges("hello world", "hello beautiful world");
    expect(result).toEqual([
      {
        start: 6,
        delete: 0,
        insert: "beautiful ",
      },
    ]);
  });

  it("handles deletion at start", () => {
    const result = computeTextChanges("hello world", "world");
    expect(result).toEqual([
      {
        start: 0,
        delete: 6,
        insert: "",
      },
    ]);
  });

  it("handles deletion at end", () => {
    const result = computeTextChanges("hello world", "hello");
    expect(result).toEqual([
      {
        start: 5,
        delete: 6,
        insert: "",
      },
    ]);
  });

  it("handles deletion in middle", () => {
    const result = computeTextChanges("hello beautiful world", "hello world");
    expect(result).toEqual([
      {
        start: 6,
        delete: 10,
        insert: "",
      },
    ]);
  });

  it("handles replacement", () => {
    const result = computeTextChanges("hello world", "hello universe");
    expect(result).toEqual([
      {
        start: 6,
        delete: 5,
        insert: "universe",
      },
    ]);
  });

  it("handles single char insertion", () => {
    const result = computeTextChanges("abc", "abxc");
    expect(result).toEqual([
      {
        start: 2,
        delete: 0,
        insert: "x",
      },
    ]);
  });

  it("handles single char deletion", () => {
    const result = computeTextChanges("abxc", "abc");
    expect(result).toEqual([
      {
        start: 2,
        delete: 1,
        insert: "",
      },
    ]);
  });

  it("handles single char replacement", () => {
    const result = computeTextChanges("abc", "axc");
    expect(result).toEqual([
      {
        start: 1,
        delete: 1,
        insert: "x",
      },
    ]);
  });

  it("should handle complete replacement", () => {
    const result = computeTextChanges("abc", "xyz");
    expect(result).toEqual([
      {
        start: 0,
        delete: 3,
        insert: "xyz",
      },
    ]);
  });

  it("handles insertion into empty string", () => {
    const result = computeTextChanges("", "hello");
    expect(result).toEqual([
      {
        start: 0,
        delete: 0,
        insert: "hello",
      },
    ]);
  });

  it("handles deletion to empty string", () => {
    const result = computeTextChanges("hello", "");
    expect(result).toEqual([
      {
        start: 0,
        delete: 5,
        insert: "",
      },
    ]);
  });

  it("handles strings with only whitespace", () => {
    const result = computeTextChanges("   ", "  \t");
    expect(result).toEqual([
      {
        start: 2,
        delete: 1,
        insert: "\t",
      },
    ]);
  });

  it("handles multiline strings", () => {
    const result = computeTextChanges("line1\nline2", "line1\nmodified\nline2");
    expect(result).toEqual([
      {
        start: 6,
        delete: 0,
        insert: "modified\n",
      },
    ]);
  });

  it("handles unicode characters", () => {
    const result = computeTextChanges("héllo", "héllö");
    expect(result).toEqual([
      {
        start: 4,
        delete: 1,
        insert: "ö",
      },
    ]);
  });

  it("handles surrogate emojis parts", () => {
    const result = computeTextChanges("hello 👋", "hello 😎");
    expect(result).toEqual([
      {
        start: 6,
        delete: 1,
        insert: "😎",
      },
    ]);
  });

  it("handles surrogate emoji pairs", () => {
    const result = computeTextChanges("hello 😀", "hello 😎");
    expect(result).toEqual([
      {
        start: 6,
        delete: 1,
        insert: "😎",
      },
    ]);
  });
});

describe(applyCodeChanges, () => {
  it("applies single insertion", () => {
    const text = createText("abc def ghi");
    const changes = [{ start: 4, delete: 0, insert: "XYZ " }];
    applyCodeChanges(text, changes);
    expect(text.toString()).toBe("abc XYZ def ghi");
  });

  it("applies single deletion", () => {
    const text = createText("abc def ghi");
    const changes = [{ start: 4, delete: 4, insert: "" }];
    applyCodeChanges(text, changes);
    expect(text.toString()).toBe("abc ghi");
  });

  it("applies single replacement", () => {
    const text = createText("abc def ghi");
    const changes = [{ start: 4, delete: 3, insert: "XYZ" }];
    applyCodeChanges(text, changes);
    expect(text.toString()).toBe("abc XYZ ghi");
  });

  it("applies multiple changes with correct offset", () => {
    const text = createText("abc def ghi");
    const changes = [
      { start: 0, delete: 0, insert: "START " },
      { start: 4, delete: 3, insert: "MIDDLE" },
    ];
    applyCodeChanges(text, changes);
    expect(text.toString()).toBe("START abc MIDDLE ghi");
  });

  it("handles empty changes array", () => {
    const text = createText("abc def ghi");
    const originalContent = text.toString();
    applyCodeChanges(text, []);
    expect(text.toString()).toBe(originalContent);
  });
});

function createText(content: string) {
  const doc = new Y.Doc();
  const text = doc.getText("content");
  text.insert(0, content);
  return text;
}
