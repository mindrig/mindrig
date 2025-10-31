import type { Prompt } from "@mindrig/types";
import {
  areFileMetasEqual,
  EditorFile,
  editorFileToMeta,
} from "@wrkspc/core/editor";
import {
  buildMapFileId,
  buildMapPromptId,
  PlaygroundMap,
  playgroundMapSpanFromPrompt,
  PlaygroundState,
} from "@wrkspc/core/playground";
import { distance } from "fastest-levenshtein";

//#region Constants

const MATCHED_FILE_PROMPTS_BY_PATH_THRESHOLD =
  0.4 as PlaygroundResolve.MatchedPromptsScore;
const MATCHING_FILE_BY_DISTANCE_THRESHOLD =
  0.4 as PlaygroundResolve.MatchingContentScore;
const MATCHING_CONTENT_THRESHOLD =
  0.6 as PlaygroundResolve.MatchingContentScore;
const PROMPT_PREVIEW_LENGTH = 160;

//#endregion

//#region Types

export namespace PlaygroundResolve {
  export type MatchingContentScore = number & {
    [matchingContentScoreBrand]: true;
  };
  declare const matchingContentScoreBrand: unique symbol;

  export type MatchedPromptsScore = number & {
    [matchedPromptsScore]: true;
  };
  declare const matchedPromptsScore: unique symbol;

  export type MatchingPromptsScores = Map<
    PlaygroundMap.Prompt,
    MatchingContentScore
  >;

  export interface MatchFileResult extends MatchFileScores {
    mapFile: PlaygroundMap.File;
    changed: boolean;
  }

  export interface MatchFileScores {
    matchedPromptsScore: MatchedPromptsScore;
    matchingScore: MatchingContentScore;
    matchedCount: number;
  }

  export interface MatchPromptsResult {
    matchedMapPrompts: Map<Prompt, PlaygroundMap.Prompt>;
    unmatchedMapPrompts: Set<PlaygroundMap.Prompt>;
    unmatchedParsedPrompts: Set<Prompt>;
    matchingScores: PlaygroundResolve.MatchingPromptsScores;
  }
}

//#endregion

//#region State

//#region resolvePlaygroundState

export namespace ResolvePlaygroundState {
  export interface Props {
    timestamp: number;
    map: PlaygroundMap;
    file: EditorFile | null;
    parsedPrompts: readonly Prompt[];
    pin: PlaygroundState.Ref | null;
  }
}

export function resolvePlaygroundState(
  props: ResolvePlaygroundState.Props,
): PlaygroundState {
  const { file, map, pin, parsedPrompts } = props;

  const mapFile = file ? map.files[file.path] : undefined;

  const pinFile = pin
    ? Object.values(map.files).find((file) => file.id === pin.fileId)
    : undefined;

  if (pin && pinFile) {
    const pinPrompt = pinFile.prompts.find((item) => item.id === pin.promptId);
    if (pinPrompt)
      return {
        file: pinFile.meta,
        prompt: toPromptState(pinFile.id, pinPrompt, "pinned"),
        prompts: mapFilePromptItems(pinFile),
        pin,
      };
  }

  const fileMeta = file ? editorFileToMeta(file) : null;
  const prompts = mapFile ? mapFilePromptItems(mapFile) : [];

  const cursor = file?.cursor;
  const parsedPromptIdx =
    cursor &&
    parsedPrompts.findIndex(
      (prompt) =>
        prompt.span.outer.start <= cursor.offset &&
        prompt.span.outer.end >= cursor.offset,
    );
  const cursorPrompt =
    typeof parsedPromptIdx === "number" &&
    mapFile &&
    mapFile.prompts[parsedPromptIdx];

  if (!cursorPrompt)
    return {
      file: fileMeta,
      prompt: null,
      prompts,
      pin: null,
    };

  return {
    file: fileMeta,
    prompt: toPromptState(mapFile.id, cursorPrompt, "cursor"),
    prompts,
    pin: null,
  };
}

//#endregion

//#endregion

//#region Map

export function resolvePlaygroundMapFile(
  map: PlaygroundMap,
  fileId: PlaygroundMap.FileId,
): PlaygroundMap.File | null {
  return Object.values(map.files).find((file) => file.id === fileId) || null;
}

export function resolvePlaygroundMapPair(
  map: PlaygroundMap,
  ref: PlaygroundState.Ref,
): PlaygroundMap.Pair | null {
  const file = resolvePlaygroundMapFile(map, ref.fileId);
  if (!file) return null;
  const prompt = file.prompts.find((prompt) => prompt.id === ref.promptId);
  if (!prompt) return null;
  return [file, prompt];
}

//#endregion

//#region Map files

//#region resolveFilePromptsMap

export namespace ResolvePlaygroundMap {
  export interface Props {
    timestamp: number;
    map: PlaygroundMap;
    file: EditorFile;
    parsedPrompts: readonly Prompt[];
  }
}

export function resolvePlaygroundMap(
  props: ResolvePlaygroundMap.Props,
): PlaygroundMap {
  const { timestamp, map, file } = props;

  const match = matchPlaygroundMapFile(props);

  if (!match.changed) return map;

  const nextMap: PlaygroundMap = {
    v: 1,
    files: {
      ...map.files,
      [file.path]: match.mapFile,
    },
    updatedAt: timestamp,
  };

  return nextMap;
}

//#endregion

//#region matchPlaygroundMapFile

export namespace MatchPlaygroundMapFile {
  export interface Props {
    timestamp: number;
    map: PlaygroundMap;
    file: EditorFile;
    parsedPrompts: readonly Prompt[];
  }
}

export function matchPlaygroundMapFile(
  props: MatchPlaygroundMapFile.Props,
): PlaygroundResolve.MatchFileResult {
  const { timestamp, map, file, parsedPrompts } = props;
  const byPath = map.files[file.path];

  if (byPath) {
    const {
      nextMapPrompts,
      matchedPromptsScore,
      matchingScore,
      matchedCount,
      changed: matchChanged,
    } = matchPlaygroundMapPrompts({
      timestamp,
      mapPrompts: byPath.prompts,
      parsedPrompts,
    });

    if (matchedPromptsScore >= MATCHED_FILE_PROMPTS_BY_PATH_THRESHOLD) {
      const newMeta = editorFileToMeta(file);
      const changed = matchChanged || !areFileMetasEqual(byPath.meta, newMeta);
      const mapFile: PlaygroundMap.File = {
        v: 1,
        id: byPath.id,
        updatedAt: changed ? timestamp : byPath.updatedAt,
        meta: newMeta,
        prompts: nextMapPrompts,
      };
      return {
        mapFile,
        matchedPromptsScore,
        matchingScore,
        matchedCount,
        changed,
      };
    }
  }

  const byDistance = matchPlaygroundMapFileByDistance({
    timestamp,
    file,
    map,
    parsedPrompts,
  });
  if (byDistance) return byDistance;

  const mapFile: PlaygroundMap.File = {
    v: 1,
    id: buildMapFileId(),
    updatedAt: timestamp,
    meta: editorFileToMeta(file),
    prompts: parsedPrompts.map<PlaygroundMap.PromptV1>((prompt) => ({
      v: 1,
      id: buildMapPromptId(),
      content: prompt.exp,
      updatedAt: timestamp,
      span: playgroundMapSpanFromPrompt(prompt),
    })),
  };

  return {
    mapFile,
    changed: true,
    matchedPromptsScore: 0 as PlaygroundResolve.MatchedPromptsScore,
    matchingScore: 0 as PlaygroundResolve.MatchingContentScore,
    matchedCount: 0,
  };
}

//#endregion

//#region matchPlaygroundMapFileByDistance

export namespace MatchPlaygroundMapFileByDistance {
  export interface Props {
    timestamp: number;
    file: EditorFile;
    map: PlaygroundMap;
    parsedPrompts: readonly Prompt[];
  }

  export interface Candidate {
    mapFile: PlaygroundMap.File;
    result: MatchPlaygroundMapPrompts.Result;
  }

  export interface BestCandidate extends Candidate {
    adjustedMatchingScore: PlaygroundResolve.MatchingContentScore;
  }
}

export function matchPlaygroundMapFileByDistance(
  props: MatchPlaygroundMapFileByDistance.Props,
): PlaygroundResolve.MatchFileResult | null {
  const { timestamp, file, map, parsedPrompts } = props;

  const candidates: MatchPlaygroundMapFileByDistance.Candidate[] = [];

  for (const mapFile of Object.values(map.files) as PlaygroundMap.File[]) {
    const result = matchPlaygroundMapPrompts({
      timestamp: props.timestamp,
      mapPrompts: mapFile.prompts,
      parsedPrompts,
    });

    candidates.push({ mapFile, result });
  }

  const maxMatchedCount = Math.max(
    ...candidates.map(({ result }) => result.matchedCount),
  );

  const bestCandidate =
    candidates.reduce<MatchPlaygroundMapFileByDistance.BestCandidate | null>(
      (best, candidate) => {
        const adjustedMatchingScore =
          adjustMatchedPromptsMatchingScoreToMatchedCount({
            matchingScore: candidate.result.matchingScore,
            matchedCount: candidate.result.matchedCount,
            maxMatchedCount,
          });

        if (!best || adjustedMatchingScore > best.adjustedMatchingScore)
          return { ...candidate, adjustedMatchingScore };

        return best;
      },
      null,
    );

  if (
    bestCandidate &&
    bestCandidate.result.matchingScore >= MATCHING_FILE_BY_DISTANCE_THRESHOLD
  ) {
    const {
      mapFile: { id, meta, updatedAt },
      result: {
        nextMapPrompts,
        changed: bestMatchChanged,
        matchedPromptsScore,
        matchingScore,
        matchedCount,
      },
    } = bestCandidate;
    const newMeta = editorFileToMeta(file);
    const changed = bestMatchChanged || !areFileMetasEqual(meta, newMeta);
    const mapFile: PlaygroundMap.File = {
      v: 1,
      id,
      updatedAt:
        changed || !areFileMetasEqual(meta, newMeta) ? timestamp : updatedAt,
      meta: newMeta,
      prompts: nextMapPrompts,
    };

    return {
      mapFile,
      changed,
      matchedPromptsScore,
      matchingScore,
      matchedCount,
    };
  }

  return null;
}

//#endregion

//#endregion

//#region Map prompts

//#region matchPlaygroundMapPrompts

export namespace MatchPlaygroundMapPrompts {
  export interface Props {
    timestamp: number;
    mapPrompts: readonly PlaygroundMap.Prompt[];
    parsedPrompts: readonly Prompt[];
  }

  export interface Result extends PlaygroundResolve.MatchFileScores {
    nextMapPrompts: PlaygroundMap.Prompt[];
    changed: boolean;
  }
}

export function matchPlaygroundMapPrompts(
  props: MatchPlaygroundMapPrompts.Props,
): MatchPlaygroundMapPrompts.Result {
  const byContent = matchPlaygroundMapPromptsByContent({
    unmatchedMapPrompts: new Set(props.mapPrompts),
    unmatchedParsedPrompts: new Set(props.parsedPrompts),
  });

  const byDistance = matchPlaygroundMapPromptsByDistance({
    timestamp: props.timestamp,
    unmatchedMapPrompts: byContent.unmatchedMapPrompts,
    unmatchedParsedPrompts: byContent.unmatchedParsedPrompts,
  });

  const matchedMapPrompts = new Map([
    ...byContent.matchedMapPrompts,
    ...byDistance.matchedMapPrompts,
  ]);

  const matchingScores: PlaygroundResolve.MatchingPromptsScores = new Map([
    ...byContent.matchingScores,
    ...byDistance.matchingScores,
  ]);

  const nextMapPrompts: PlaygroundMap.Prompt[] = [];
  let matchedCount = 0;

  for (const parsedPrompt of props.parsedPrompts) {
    const mapPrompt = matchedMapPrompts.get(parsedPrompt);

    if (mapPrompt) {
      nextMapPrompts.push(structuredClone(mapPrompt));
      matchedCount++;
    } else {
      nextMapPrompts.push({
        v: 1,
        id: buildMapPromptId(),
        content: parsedPrompt.exp,
        span: playgroundMapSpanFromPrompt(parsedPrompt),
        updatedAt: props.timestamp,
      });
    }
  }

  const { unmatchedMapPrompts } = byDistance;

  const matchedPromptsScore = calcMatchedPromptsScore({
    matchedMapPrompts,
    unmatchedMapPrompts,
  });

  const matchingScore = calcMatchedPromptsMatchingScore({
    matchingScores,
    unmatchedMapPrompts,
  });

  const countChanged = props.mapPrompts.length !== nextMapPrompts.length;
  const idsChanged = props.mapPrompts.some(
    (prompt, index) => prompt.id !== nextMapPrompts[index]?.id,
  );
  const changed = matchingScore !== 1 || countChanged || idsChanged;

  return {
    nextMapPrompts,
    matchedPromptsScore,
    matchingScore,
    matchedCount,
    changed,
  };
}

//#endregion

//#region matchPlaygroundMapPromptsByContent

export namespace MatchPlaygroundMapPromptsByContent {
  export interface Props {
    unmatchedMapPrompts: Set<PlaygroundMap.Prompt>;
    unmatchedParsedPrompts: Set<Prompt>;
  }
}

export function matchPlaygroundMapPromptsByContent(
  props: MatchPlaygroundMapPromptsByContent.Props,
): PlaygroundResolve.MatchPromptsResult {
  const matchedMapPrompts = new Map<Prompt, PlaygroundMap.Prompt>();
  const unmatchedMapPrompts = new Set(props.unmatchedMapPrompts);
  const unmatchedParsedPrompts = new Set(props.unmatchedParsedPrompts);

  const matchingScores: PlaygroundResolve.MatchingPromptsScores = new Map();

  unmatchedParsedPrompts.forEach((parsedPrompt) => {
    unmatchedMapPrompts.forEach((mapPrompt) => {
      if (mapPrompt.content !== parsedPrompt.exp) return;
      matchedMapPrompts.set(parsedPrompt, {
        ...mapPrompt,
        span: playgroundMapSpanFromPrompt(parsedPrompt),
      });
      matchingScores.set(
        mapPrompt,
        1 as PlaygroundResolve.MatchingContentScore,
      );
      unmatchedMapPrompts.delete(mapPrompt);
      unmatchedParsedPrompts.delete(parsedPrompt);
    });
  });

  return {
    matchedMapPrompts,
    unmatchedMapPrompts,
    unmatchedParsedPrompts,
    matchingScores,
  };
}

//#endregion

//#region matchPlaygroundMapPromptsByDistance

export namespace MatchPlaygroundMapPromptsByDistance {
  export interface Props {
    timestamp: number;
    unmatchedMapPrompts: Set<PlaygroundMap.Prompt>;
    unmatchedParsedPrompts: Set<Prompt>;
  }

  export interface Candidate {
    parsedIndex: number;
    mapPrompt: PlaygroundMap.Prompt;
    parsedPrompt: Prompt;
    matchingScore: PlaygroundResolve.MatchingContentScore;
  }
}

export function matchPlaygroundMapPromptsByDistance(
  props: MatchPlaygroundMapPromptsByDistance.Props,
): PlaygroundResolve.MatchPromptsResult {
  const { timestamp } = props;

  const unmatchedMapPrompts = new Set(props.unmatchedMapPrompts);
  const unmatchedParsedPrompts = new Set(props.unmatchedParsedPrompts);

  const candidates: MatchPlaygroundMapPromptsByDistance.Candidate[] = [];

  Array.from(unmatchedParsedPrompts).forEach((parsedPrompt, parsedIndex) => {
    const parsedNormalized = normalizeContent(parsedPrompt.exp);
    unmatchedMapPrompts.forEach((mapPrompt) => {
      const mapNormalized = normalizeContent(mapPrompt.content);
      const matchingScore = calcMatchingContentScore(
        mapNormalized,
        parsedNormalized,
      );

      if (matchingScore <= MATCHING_CONTENT_THRESHOLD)
        candidates.push({
          parsedIndex,
          mapPrompt,
          parsedPrompt,
          matchingScore,
        });
    });
  });

  candidates.sort((a, b) => {
    if (a.matchingScore !== b.matchingScore)
      return a.matchingScore - b.matchingScore;
    // TODO: There's no test for that, so add one
    return a.parsedIndex - b.parsedIndex;
  });

  const matchedMapPrompts = new Map<Prompt, PlaygroundMap.Prompt>();
  const matchingScores: PlaygroundResolve.MatchingPromptsScores = new Map();

  candidates.forEach((candidate) => {
    const { mapPrompt, parsedPrompt, matchingScore } = candidate;
    if (
      !unmatchedMapPrompts.has(mapPrompt) ||
      !unmatchedParsedPrompts.has(parsedPrompt)
    )
      return;

    const nextMapPrompt: PlaygroundMap.Prompt = {
      v: 1,
      id: mapPrompt.id,
      content: parsedPrompt.exp,
      span: playgroundMapSpanFromPrompt(parsedPrompt),
      updatedAt: timestamp,
    };

    matchedMapPrompts.set(parsedPrompt, nextMapPrompt);
    matchingScores.set(nextMapPrompt, matchingScore);
    unmatchedMapPrompts.delete(mapPrompt);
    unmatchedParsedPrompts.delete(parsedPrompt);
  });

  return {
    matchedMapPrompts,
    unmatchedMapPrompts,
    unmatchedParsedPrompts,
    matchingScores,
  };
}

//#endregion

//#region calcMatchingPromptsScore

export namespace CalcMatchingPromptsScore {
  export interface Props {
    matchedMapPrompts: Map<Prompt, PlaygroundMap.Prompt>;
    unmatchedMapPrompts: Set<PlaygroundMap.Prompt>;
    // unmatchedParsedPrompts: Set<Prompt>;
  }
}

export function calcMatchedPromptsScore(
  props: CalcMatchingPromptsScore.Props,
): PlaygroundResolve.MatchedPromptsScore {
  const matched = props.matchedMapPrompts.size;
  if (!matched) return 0 as PlaygroundResolve.MatchedPromptsScore;

  const unmatched = props.unmatchedMapPrompts.size;
  const total = matched + unmatched;

  if (total === 0) return 1 as PlaygroundResolve.MatchedPromptsScore;
  return (matched / total) as PlaygroundResolve.MatchedPromptsScore;
}

//#endregion

//#endregion

//#region Utils

const WHITESPACE_RE = /\s+/g;
const NEWLINE_RE = /\r?\n/;

function normalizeContent(value: string): string {
  return value.trim().replace(WHITESPACE_RE, " ");
}

function calcMatchingContentScore(
  a: string,
  b: string,
): PlaygroundResolve.MatchingContentScore {
  const maxLength = Math.max(a.length, b.length);
  if (a === b || maxLength === 0)
    return 0 as PlaygroundResolve.MatchingContentScore;
  return (distance(a, b) / maxLength) as PlaygroundResolve.MatchingContentScore;
}

namespace CalcMatchedPromptsMatchingScore {
  export interface Props {
    matchingScores: PlaygroundResolve.MatchingPromptsScores;
    unmatchedMapPrompts: Set<PlaygroundMap.Prompt>;
  }
}

function calcMatchedPromptsMatchingScore(
  props: CalcMatchedPromptsMatchingScore.Props,
): PlaygroundResolve.MatchingContentScore {
  const { matchingScores, unmatchedMapPrompts } = props;
  const total = matchingScores.size + unmatchedMapPrompts.size;
  const sum = [...matchingScores.values()].reduce(
    (sum, score) => sum + score,
    0,
  );
  return (sum / total) as PlaygroundResolve.MatchingContentScore;
}

export namespace AdjustMatchedPromptsMatchingScoreToMatchedCount {
  export interface Props {
    matchingScore: PlaygroundResolve.MatchingContentScore;
    matchedCount: number;
    maxMatchedCount: number;
  }
}

function adjustMatchedPromptsMatchingScoreToMatchedCount(
  props: AdjustMatchedPromptsMatchingScoreToMatchedCount.Props,
): PlaygroundResolve.MatchingContentScore {
  const { matchingScore, matchedCount, maxMatchedCount } = props;
  if (!matchedCount || !maxMatchedCount)
    return 0 as PlaygroundResolve.MatchingContentScore;
  const countFactor = matchedCount / maxMatchedCount;
  return (matchingScore *
    countFactor) as PlaygroundResolve.MatchingContentScore;
}

function truncatePromptContent(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "";
  const firstLine = trimmed.split(NEWLINE_RE)[0] ?? "";
  if (firstLine.length <= PROMPT_PREVIEW_LENGTH) return firstLine;
  return `${firstLine.slice(0, PROMPT_PREVIEW_LENGTH - 1)}…`;
}

function mapFilePromptItems(
  mapFile: PlaygroundMap.File,
): PlaygroundState.PromptItem[] {
  return mapFile.prompts.map(toPromptItem.bind(null, mapFile.id));
}

function toPromptItem(
  fileId: PlaygroundMap.FileId,
  prompt: PlaygroundMap.Prompt,
): PlaygroundState.PromptItem {
  return {
    v: 1,
    fileId,
    promptId: prompt.id,
    preview: truncatePromptContent(prompt.content),
  };
}

function toPromptState(
  fileId: PlaygroundMap.FileId,
  prompt: PlaygroundMap.Prompt,
  reason: PlaygroundState.PromptReason,
): PlaygroundState.Prompt {
  return {
    v: 1,
    fileId,
    promptId: prompt.id,
    content: prompt.content,
    reason,
  };
}

//#endregion
