import type { VscMessage } from "./types.js";

export function isVscMessage(value: unknown): value is VscMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { type?: unknown }).type === "string"
  );
}

export function isVscMessageOfType<
  T extends VscMessage,
  Type extends T extends { type: infer K } ? K : never,
>(
  value: unknown,
  expectedType: Type,
): value is Extract<VscMessage, { type: Type }> {
  return isVscMessage(value) && value.type === expectedType;
}
