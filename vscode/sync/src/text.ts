import * as Y from "yjs";

/**
 * Represents a text change operation.
 */
export interface TextChange {
  start: number;
  delete: number;
  insert: string;
}

/**
 * Computes the minimal text changes needed to transform previous text string
 * into new text string using a diff algorithm that finds the longest common
 * prefix and suffix.
 *
 * @param oldStr - Original text string.
 * @param newStr - Target text string.
 *
 * @returns Array of text change operations.
 */
export function computeTextChanges(
  oldStr: string,
  newStr: string,
): TextChange[] {
  if (oldStr === newStr) return [];

  const oldArr = Array.from(oldStr);
  const newArr = Array.from(newStr);

  // Find the longest common prefix

  let prefixEnd = 0;
  const minLength = Math.min(oldArr.length, newArr.length);
  while (prefixEnd < minLength && oldArr[prefixEnd] === newArr[prefixEnd])
    prefixEnd++;

  // Find the longest common suffix

  let suffixStart = 0;
  const oldSuffix = oldArr.length - prefixEnd;
  const newSuffix = newArr.length - prefixEnd;
  const maxSuffix = Math.min(oldSuffix, newSuffix);
  while (
    suffixStart < maxSuffix &&
    oldArr[oldArr.length - 1 - suffixStart] ===
      newArr[newArr.length - 1 - suffixStart]
  )
    suffixStart++;

  const start = prefixEnd;
  const deleteChars = oldArr.length - prefixEnd - suffixStart;
  const insertArr = newArr.slice(prefixEnd, newArr.length - suffixStart);
  if (deleteChars === 0 && insertArr.length === 0) return [];

  const insert = insertArr.join("");

  return [{ start, delete: deleteChars, insert }];
}

/**
 * Applies text changes to a Yjs Text object incrementally.
 *
 * @param text - Yjs Text object to apply changes to.
 * @param changes - Array of code change operations.
 */
export function applyCodeChanges(text: Y.Text, changes: TextChange[]): void {
  let offset = 0;
  for (const change of changes) {
    const adjustedStart = change.start + offset;

    if (change.delete > 0) {
      text.delete(adjustedStart, change.delete);
      offset -= change.delete;
    }

    if (change.insert.length > 0) {
      text.insert(adjustedStart, change.insert);
      offset += change.insert.length;
    }
  }
}
