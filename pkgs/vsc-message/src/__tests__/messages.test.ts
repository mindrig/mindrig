import { describe, expect, it } from "vitest";

import { isVscMessage, isVscMessageOfType } from "../guards.js";
import type { VscMessage } from "../types.js";
import type { VscMessagePrompts } from "../domains/prompts/messages.js";

const promptsChanged: VscMessagePrompts.Changed = {
  type: "prompts-changed",
  payload: {
    prompts: [],
    parseStatus: "success",
  },
};

describe("VscMessage guards", () => {
  it("recognises known message shapes", () => {
    expect(isVscMessage(promptsChanged)).toBe(true);
  });

  it("narrows by type", () => {
    const message: VscMessage = promptsChanged;
    if (!isVscMessageOfType(message, "prompts-changed")) {
      throw new Error("expected prompts-changed message");
    }

    expect(message.payload.parseStatus).toBe("success");
  });
});
