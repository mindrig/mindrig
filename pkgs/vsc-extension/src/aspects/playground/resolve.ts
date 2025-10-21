import { distance as levenshteinDistance } from "fastest-levenshtein";
import { randomUUID } from "node:crypto";
import { EditorFile } from "@wrkspc/core/editor";
import { PlaygroundMap, PlaygroundState } from "@wrkspc/core/playground";
import type { Prompt } from "@mindrig/types";

const MATCH_BY_PATH_THRESHOLD = 0.6;
const MATCH_BY_DISTANCE_THRESHOLD = 0.4;
const MAX_PROMPT_DISTANCE_RATIO = 0.6;
const PROMPT_PREVIEW_MAX_LENGTH = 160;
const UNSET_TIMESTAMP = -1;

const WHITESPACE_RE = /\s+/g;
const NEWLINE_RE = /\r?\n/;

let currentMatchedOrder: WeakMap<PlaygroundMap.Prompt, number> | null = null;

function normalizeContent(value: string): string {
  return value.trim().replace(WHITESPACE_RE, " ");
}

function calcDistanceRatio(a: string, b: string): number {
  if (a === b) return 0;
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 0;
  return levenshteinDistance(a, b) / maxLength;
}

function cloneSet<T>(values: Set<T>): Set<T> {
  return new Set(values);
}

function createPromptId(): PlaygroundMap.PromptId {
  return `prompt-${randomUUID()}` as PlaygroundMap.PromptId;
}

function createFileId(): PlaygroundMap.FileId {
  return `file-${randomUUID()}` as PlaygroundMap.FileId;
}

function createPromptPreview(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "";
  const firstLine = trimmed.split(NEWLINE_RE)[0] ?? "";
  if (firstLine.length <= PROMPT_PREVIEW_MAX_LENGTH) return firstLine;
  return `${firstLine.slice(0, PROMPT_PREVIEW_MAX_LENGTH - 1)}…`;
}

function createNewPrompt(content: string): PlaygroundMap.Prompt {
  return {
    id: createPromptId(),
    content,
    updatedAt: UNSET_TIMESTAMP,
  };
}

function promptsAreEqual(
  left: readonly PlaygroundMap.Prompt[],
  right: readonly PlaygroundMap.Prompt[],
): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index];
    const b = right[index];
    if (!a || !b) return false;
    if (a.id !== b.id) return false;
    if (a.content !== b.content) return false;
  }
  return true;
}

function findPromptById(
  prompts: readonly PlaygroundMap.Prompt[],
  promptId: PlaygroundMap.PromptId,
): PlaygroundMap.Prompt | undefined {
  return prompts.find((item: PlaygroundMap.Prompt) => item.id === promptId);
}

function toPromptItem(
  fileId: EditorFile.Path,
  prompt: PlaygroundMap.Prompt,
): PlaygroundState.PromptItem {
  return {
    fileId,
    promptId: prompt.id,
    preview: createPromptPreview(prompt.content),
  };
}

function toPromptState(
  fileId: EditorFile.Path,
  prompt: PlaygroundMap.Prompt,
  reason: PlaygroundState.PromptReason,
): PlaygroundState.Prompt {
  return {
    fileId,
    promptId: prompt.id,
    content: prompt.content,
    reason,
  };
}

function toFileMeta(file: EditorFile): EditorFile.Meta {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { content, ...meta } = file;
  return meta;
}

function resolveCursorPromptIndex(
  parsedPrompts: readonly Prompt[],
  cursor: EditorFile.Cursor | undefined,
): number | null {
  if (!cursor) return null;
  for (let index = 0; index < parsedPrompts.length; index += 1) {
    const prompt = parsedPrompts[index];
    if (!prompt) continue;
    const span = prompt.span?.outer;
    if (!span) continue;
    if (cursor.offset >= span.start && cursor.offset <= span.end) return index;
  }
  return null;
}

function ensureMatchedOrder(prompt: PlaygroundMap.Prompt, index: number): void {
  if (!currentMatchedOrder) return;
  currentMatchedOrder.set(prompt, index);
}

export namespace ResolvePlaygroundState {
  export interface Props {
    timestamp: number;
    map: PlaygroundMap;
    file: EditorFile | null;
    parsedPrompts: Prompt[];
    pin: PlaygroundState.Ref | null;
  }
}

export function resolvePlaygroundState(
  props: ResolvePlaygroundState.Props,
): PlaygroundState {
  const { file, map, pin, parsedPrompts } = props;
  const fileMeta = file ? toFileMeta(file) : null;
  const filePath = file?.path;
  const mapFile = filePath ? map.files[filePath] : undefined;
  const prompts =
    filePath && mapFile
      ? mapFile.prompts.map((prompt: PlaygroundMap.Prompt) =>
          toPromptItem(filePath, prompt),
        )
      : [];

  const pinFile = pin ? map.files[pin.fileId] : undefined;
  const sanitizedPin =
    pin && pinFile && findPromptById(pinFile.prompts, pin.promptId)
      ? pin
      : null;

  if (!filePath || !mapFile || mapFile.prompts.length === 0) {
    return {
      file: fileMeta,
      prompt: null,
      prompts,
      pin: sanitizedPin,
    };
  }

  if (sanitizedPin) {
    const pinnedFile = map.files[sanitizedPin.fileId];
    const pinnedPrompt = pinnedFile
      ? findPromptById(pinnedFile.prompts, sanitizedPin.promptId)
      : undefined;

    if (pinnedPrompt) {
      return {
        file: fileMeta,
        prompt: toPromptState(sanitizedPin.fileId, pinnedPrompt, "pinned"),
        prompts,
        pin: sanitizedPin,
      };
    }
  }

  const cursorPromptIndex =
    file && parsedPrompts.length > 0
      ? resolveCursorPromptIndex(parsedPrompts, file.cursor)
      : null;

  const promptIndex =
    typeof cursorPromptIndex === "number" &&
    cursorPromptIndex >= 0 &&
    cursorPromptIndex < mapFile.prompts.length
      ? cursorPromptIndex
      : mapFile.prompts.length > 0
        ? 0
        : null;

  const matchedPrompt =
    promptIndex !== null ? mapFile.prompts[promptIndex] : undefined;

  const activePrompt =
    matchedPrompt && filePath
      ? toPromptState(filePath, matchedPrompt, "cursor")
      : null;

  return {
    file: fileMeta,
    prompt: activePrompt,
    prompts,
    pin: sanitizedPin,
  };
}

export namespace ResolveFilePromptsMap {
  export interface Props {
    timestamp: number;
    map: PlaygroundMap;
    file: EditorFile | null;
    parsedPrompts: Prompt[];
  }
}

export function resolveFilePromptsMap(
  props: ResolveFilePromptsMap.Props,
): PlaygroundMap {
  const { timestamp, map, file, parsedPrompts } = props;
  if (!file) return map;

  const filePath = file.path;
  const existingFile = map.files[filePath];

  let baseFile: PlaygroundMap.File | null = null;
  let baseMatchResult: MatchPlaygroundMapPrompts.Result | null = null;
  let matchingReason: PlaygroundMap.MatchingReason = "new";

  if (existingFile) {
    const result = matchPlaygroundMapPrompts({
      mapPrompts: existingFile.prompts,
      parsedPrompts,
    });

    if (result.matchingScore >= MATCH_BY_PATH_THRESHOLD) {
      baseFile = existingFile;
      baseMatchResult = result;
      matchingReason = "content";
    }
  }

  if (!baseFile) {
    const distanceFile = matchPlaygroundMapFileByDistance({
      map,
      parsedPrompts,
    });

    if (distanceFile) {
      const result = matchPlaygroundMapPrompts({
        mapPrompts: distanceFile.prompts,
        parsedPrompts,
      });

      if (result.matchingScore >= MATCH_BY_DISTANCE_THRESHOLD) {
        baseFile = distanceFile;
        baseMatchResult = result;
        matchingReason = "distance";
      }
    }
  }

  const nextFiles = { ...map.files };

  if (!baseFile) {
    const prompts = parsedPrompts.map((prompt) => ({
      id: createPromptId(),
      content: prompt.exp,
      updatedAt: timestamp,
    }));

    const nextFile: PlaygroundMap.File = {
      id: createFileId(),
      path: filePath,
      prompts,
      updatedAt: timestamp,
    };

    nextFiles[filePath] = nextFile;

    return {
      files: nextFiles,
      updatedAt: timestamp,
    };
  }

  const matchResult =
    baseMatchResult ??
    matchPlaygroundMapPrompts({
      mapPrompts: baseFile.prompts,
      parsedPrompts,
    });

  const removedPromptIds = new Set(
    [...matchResult.unmatchedMapPrompts].map(
      (prompt: PlaygroundMap.Prompt) => prompt.id,
    ),
  );

  const updatedPrompts = matchResult.nextPrompts.map(
    (prompt: PlaygroundMap.Prompt) => {
      const previous = baseFile!.prompts.find(
        (item: PlaygroundMap.Prompt) => item.id === prompt.id,
      );
      const isNew = !previous;
      const contentChanged = previous
        ? previous.content !== prompt.content
        : false;
      const needsUpdate =
        isNew ||
        contentChanged ||
        prompt.updatedAt === UNSET_TIMESTAMP ||
        removedPromptIds.has(prompt.id) ||
        matchingReason !== "content";

      return {
        ...prompt,
        updatedAt: needsUpdate
          ? timestamp
          : previous
            ? previous.updatedAt
            : timestamp,
      };
    },
  );

  const promptsChanged =
    removedPromptIds.size > 0 ||
    matchResult.unmatchedParsedPrompts.size > 0 ||
    !promptsAreEqual(baseFile.prompts, updatedPrompts);

  const fileChanged = promptsChanged || baseFile.path !== filePath;

  const nextFile: PlaygroundMap.File = fileChanged
    ? {
        ...baseFile,
        path: filePath,
        prompts: updatedPrompts,
        updatedAt: timestamp,
      }
    : baseFile;

  if (baseFile.path !== filePath) delete nextFiles[baseFile.path];
  nextFiles[filePath] = nextFile;

  if (!fileChanged) return map;

  return {
    files: nextFiles,
    updatedAt: timestamp,
  };
}

export namespace MatchPlaygroundMapFile {
  export interface Props {
    timestamp: number;
    map: PlaygroundMap;
    file: EditorFile;
    parsedPrompts: Prompt[];
  }
}

export function matchPlaygroundMapFile(
  props: MatchPlaygroundMapFile.Props,
): PlaygroundMap.File | null {
  const { map, file, parsedPrompts } = props;
  const byPath = map.files[file.path];

  if (byPath) {
    const result = matchPlaygroundMapPrompts({
      mapPrompts: byPath.prompts,
      parsedPrompts,
    });

    if (result.matchingScore >= MATCH_BY_PATH_THRESHOLD) return byPath;
  }

  return matchPlaygroundMapFileByDistance({ map, parsedPrompts });
}

export namespace MatchPlaygroundMapFileByDistance {
  export interface Props {
    map: PlaygroundMap;
    parsedPrompts: Prompt[];
  }
}

export function matchPlaygroundMapFileByDistance(
  props: MatchPlaygroundMapFileByDistance.Props,
): PlaygroundMap.File | null {
  const { map, parsedPrompts } = props;
  let bestMatch: { file: PlaygroundMap.File; score: number } | null = null;

  for (const file of Object.values(map.files) as PlaygroundMap.File[]) {
    const result = matchPlaygroundMapPrompts({
      mapPrompts: file.prompts,
      parsedPrompts,
    });

    if (!bestMatch || result.matchingScore > bestMatch.score) {
      bestMatch = { file, score: result.matchingScore };
    }
  }

  if (bestMatch && bestMatch.score >= MATCH_BY_DISTANCE_THRESHOLD) {
    return bestMatch.file;
  }

  return null;
}

export namespace MatchPlaygroundMapPrompts {
  export interface Props {
    mapPrompts: PlaygroundMap.Prompt[];
    parsedPrompts: Prompt[];
  }

  export interface Result {
    nextPrompts: PlaygroundMap.Prompt[];
    unmatchedMapPrompts: Set<PlaygroundMap.Prompt>;
    unmatchedParsedPrompts: Set<Prompt>;
    matchingScore: number;
  }
}

export function matchPlaygroundMapPrompts(
  props: MatchPlaygroundMapPrompts.Props,
): MatchPlaygroundMapPrompts.Result {
  currentMatchedOrder = new WeakMap();

  const initialMapPrompts = new Set(props.mapPrompts);
  const initialParsedPrompts = new Set(props.parsedPrompts);

  const contentResult = matchPlaygroundMapPromptsByContent({
    unmatchedMapPrompts: initialMapPrompts,
    unmatchedParsedPrompts: initialParsedPrompts,
  });

  const distanceResult = matchPlaygroundMapPromptsByDistance({
    unmatchedMapPrompts: contentResult.unmatchedMapPrompts,
    unmatchedParsedPrompts: contentResult.unmatchedParsedPrompts,
  });

  const matchedPrompts = [
    ...contentResult.matchedMapPrompts,
    ...distanceResult.matchedMapPrompts,
  ];

  matchedPrompts.sort((a, b) => {
    const orderA = currentMatchedOrder?.get(a) ?? 0;
    const orderB = currentMatchedOrder?.get(b) ?? 0;
    return orderA - orderB;
  });

  const unmatchedParsedPrompts = distanceResult.unmatchedParsedPrompts;

  const nextPrompts: PlaygroundMap.Prompt[] = [];
  const matchedIterator = matchedPrompts[Symbol.iterator]();

  for (const parsedPrompt of props.parsedPrompts) {
    if (!unmatchedParsedPrompts.has(parsedPrompt)) {
      const match = matchedIterator.next().value;
      if (match) {
        nextPrompts.push(match);
      }
      continue;
    }

    nextPrompts.push(createNewPrompt(parsedPrompt.exp));
  }

  const matchingScore = calcMatchingPromptsScore({
    matchedMapPrompts: matchedPrompts,
    unmatchedMapPrompts: distanceResult.unmatchedMapPrompts,
    unmatchedParsedPrompts,
  });

  currentMatchedOrder = null;

  return {
    nextPrompts,
    unmatchedMapPrompts: distanceResult.unmatchedMapPrompts,
    unmatchedParsedPrompts,
    matchingScore,
  };
}

export namespace MatchPlaygroundMapPromptsByContent {
  export interface Props {
    unmatchedMapPrompts: Set<PlaygroundMap.Prompt>;
    unmatchedParsedPrompts: Set<Prompt>;
  }

  export interface Result {
    matchedMapPrompts: PlaygroundMap.Prompt[];
    unmatchedMapPrompts: Set<PlaygroundMap.Prompt>;
    unmatchedParsedPrompts: Set<Prompt>;
  }
}

export function matchPlaygroundMapPromptsByContent(
  props: MatchPlaygroundMapPromptsByContent.Props,
): MatchPlaygroundMapPromptsByContent.Result {
  const unmatchedMapPrompts = cloneSet(props.unmatchedMapPrompts);
  const unmatchedParsedPrompts = cloneSet(props.unmatchedParsedPrompts);
  const matchedPairs: Array<{
    parsedIndex: number;
    prompt: PlaygroundMap.Prompt;
  }> = [];

  const parsedList = Array.from(unmatchedParsedPrompts);
  const mapList = Array.from(unmatchedMapPrompts);

  parsedList.forEach((parsedPrompt, parsedIndex) => {
    for (const mapPrompt of mapList) {
      if (!unmatchedMapPrompts.has(mapPrompt)) continue;
      if (!unmatchedParsedPrompts.has(parsedPrompt)) break;

      if (
        normalizeContent(mapPrompt.content) ===
        normalizeContent(parsedPrompt.exp)
      ) {
        const updatedPrompt: PlaygroundMap.Prompt = {
          ...mapPrompt,
          content: parsedPrompt.exp,
        };

        ensureMatchedOrder(updatedPrompt, parsedIndex);
        matchedPairs.push({ parsedIndex, prompt: updatedPrompt });

        unmatchedMapPrompts.delete(mapPrompt);
        unmatchedParsedPrompts.delete(parsedPrompt);
        break;
      }
    }
  });

  matchedPairs.sort((a, b) => a.parsedIndex - b.parsedIndex);

  return {
    matchedMapPrompts: matchedPairs.map((pair) => pair.prompt),
    unmatchedMapPrompts,
    unmatchedParsedPrompts,
  };
}

export namespace MatchPlaygroundMapPromptsByDistance {
  export interface Props {
    unmatchedMapPrompts: Set<PlaygroundMap.Prompt>;
    unmatchedParsedPrompts: Set<Prompt>;
  }

  export interface Result {
    matchedMapPrompts: PlaygroundMap.Prompt[];
    unmatchedMapPrompts: Set<PlaygroundMap.Prompt>;
    unmatchedParsedPrompts: Set<Prompt>;
  }
}

export function matchPlaygroundMapPromptsByDistance(
  props: MatchPlaygroundMapPromptsByDistance.Props,
): MatchPlaygroundMapPromptsByDistance.Result {
  const unmatchedMapPrompts = cloneSet(props.unmatchedMapPrompts);
  const unmatchedParsedPrompts = cloneSet(props.unmatchedParsedPrompts);
  const matchedPairs: Array<{
    parsedIndex: number;
    prompt: PlaygroundMap.Prompt;
  }> = [];

  const parsedList = Array.from(unmatchedParsedPrompts);
  const mapList = Array.from(unmatchedMapPrompts);

  interface Candidate {
    parsedIndex: number;
    mapPrompt: PlaygroundMap.Prompt;
    parsedPrompt: Prompt;
    ratio: number;
  }

  const candidates: Candidate[] = [];

  parsedList.forEach((parsedPrompt, parsedIndex) => {
    const parsedNormalized = normalizeContent(parsedPrompt.exp);
    mapList.forEach((mapPrompt) => {
      if (!unmatchedMapPrompts.has(mapPrompt)) return;
      const mapNormalized = normalizeContent(mapPrompt.content);
      const ratio = calcDistanceRatio(mapNormalized, parsedNormalized);
      if (ratio <= MAX_PROMPT_DISTANCE_RATIO) {
        candidates.push({ parsedIndex, mapPrompt, parsedPrompt, ratio });
      }
    });
  });

  candidates.sort((a, b) => {
    if (a.ratio !== b.ratio) return a.ratio - b.ratio;
    return a.parsedIndex - b.parsedIndex;
  });

  for (const candidate of candidates) {
    const { mapPrompt, parsedPrompt, parsedIndex } = candidate;
    if (
      !unmatchedMapPrompts.has(mapPrompt) ||
      !unmatchedParsedPrompts.has(parsedPrompt)
    ) {
      continue;
    }

    const updatedPrompt: PlaygroundMap.Prompt = {
      ...mapPrompt,
      content: parsedPrompt.exp,
    };

    ensureMatchedOrder(updatedPrompt, parsedIndex);
    matchedPairs.push({ parsedIndex, prompt: updatedPrompt });

    unmatchedMapPrompts.delete(mapPrompt);
    unmatchedParsedPrompts.delete(parsedPrompt);
  }

  matchedPairs.sort((a, b) => a.parsedIndex - b.parsedIndex);

  return {
    matchedMapPrompts: matchedPairs.map((pair) => pair.prompt),
    unmatchedMapPrompts,
    unmatchedParsedPrompts,
  };
}

export namespace CalcMatchingPromptsScore {
  export interface Props {
    matchedMapPrompts: PlaygroundMap.Prompt[];
    unmatchedMapPrompts: Set<PlaygroundMap.Prompt>;
    unmatchedParsedPrompts: Set<Prompt>;
  }
}

export function calcMatchingPromptsScore(
  props: CalcMatchingPromptsScore.Props,
): number {
  const matchedCount = props.matchedMapPrompts.length;
  const unmatchedCount =
    props.unmatchedMapPrompts.size + props.unmatchedParsedPrompts.size;
  const total = matchedCount + unmatchedCount;

  if (total === 0) return 1;

  return matchedCount / total;
}
