import type { Prompt, PromptVar } from "@volumen/types";
import {
  areFileMetasEqual,
  EditorFile,
  editorFileToMeta,
} from "@wrkspc/core/editor";
import {
  buildMapFileId,
  buildMapPromptVarId,
  getPlaygroundMapVarContent,
  PlaygroundMap,
  PlaygroundState,
  toPlaygroundMapPrompt,
  toPlaygroundMapVar,
} from "@wrkspc/core/playground";
import { sliceSpan } from "@wrkspc/core/prompt";
import { Store } from "@wrkspc/core/store";
import { distance } from "fastest-levenshtein";

//#region Constants

const MATCHED_FILE_PROMPTS_BY_PATH_THRESHOLD =
  0.4 as PlaygroundResolve.MatchedPromptsScore;
const MATCHING_FILE_CONTENT_THRESHOLD =
  0.4 as PlaygroundResolve.MatchingContentDistance;
const MATCHING_PROMPT_CONTENT_THRESHOLD =
  0.6 as PlaygroundResolve.MatchingContentDistance;
const PROMPT_PREVIEW_LENGTH = 160;
const MATCHING_VAR_EXP_THRESHOLD =
  0.4 as PlaygroundResolve.MatchingContentDistance;

//#endregion

//#region Types

export namespace PlaygroundResolve {
  export type MatchingContentDistance = number & {
    [matchingContentDistanceBrand]: true;
  };
  declare const matchingContentDistanceBrand: unique symbol;

  export type MatchedPromptsScore = number & {
    [matchedPromptsScore]: true;
  };
  declare const matchedPromptsScore: unique symbol;

  export type MatchingPromptsDistances = Map<
    PlaygroundMap.PromptCode,
    MatchingContentDistance
  >;

  export interface MatchFileResult extends MatchFileScores {
    mapFile: PlaygroundMap.File;
    changed: boolean;
  }

  export interface MatchFileScores {
    matchedPromptsScore: MatchedPromptsScore;
    matchingDistance: MatchingContentDistance;
    matchedCount: number;
  }

  export interface MatchPromptsProps {
    source: string;
    unmatchedMapPrompts: Set<PlaygroundMap.PromptCode>;
    unmatchedParsedPrompts: Set<Prompt>;
  }

  export interface MatchPromptsResult {
    matchedMapPrompts: Map<Prompt, PlaygroundMap.PromptCode>;
    unmatchedMapPrompts: Set<PlaygroundMap.PromptCode>;
    unmatchedParsedPrompts: Set<Prompt>;
    matchingDistances: PlaygroundResolve.MatchingPromptsDistances;
  }

  export interface MatchPromptVarsProps {
    source: string;
    matchedMapPromptVarExps: Record<string, PlaygroundMap.PromptVarId>;
    unmatchedMapPromptVars: Set<PlaygroundMap.PromptVar>;
    unmatchedParsedPromptVars: Set<PromptVar>;
  }

  export interface MatchPromptVarsResult {
    matchedMapPromptVars: Map<PromptVar, PlaygroundMap.PromptVar>;
    matchedMapPromptVarExps: MatchedMapPromptVarExps;
    unmatchedMapPromptVars: Set<PlaygroundMap.PromptVar>;
    unmatchedParsedPromptVars: Set<PromptVar>;
  }

  export type MatchedMapPromptVarExps = Record<
    string,
    PlaygroundMap.PromptVarId
  >;
}

//#endregion

//#region State

//#region resolvePlaygroundState

export namespace ResolvePlaygroundState {
  export interface Props {
    timestamp: number;
    map: PlaygroundMap;
    drafts: Store.Drafts;
    editorFile: EditorFile | null;
    currentFile: EditorFile | null;
    parsedPrompts: readonly Prompt[];
    pin: PlaygroundState.Ref | null;
    parseError: string | null;
  }
}

export function resolvePlaygroundState(
  props: ResolvePlaygroundState.Props,
): PlaygroundState {
  const {
    currentFile,
    editorFile,
    map,
    drafts,
    pin,
    parsedPrompts,
    parseError,
  } = props;
  const mapFile = currentFile ? map.files[currentFile.path] : undefined;

  // First we resolve the prompt under cursor. Doing it before resolving
  // pinned prompt (that will take precedence) allows us to pick the right
  // reason for the prompt later on.

  const currentFileMeta = currentFile ? editorFileToMeta(currentFile) : null;
  const prompts = buildStatePromptItems(mapFile, drafts);

  const cursor = editorFile?.cursor;
  const parsedPromptIdx =
    currentFile?.path === editorFile?.path &&
    cursor &&
    parsedPrompts.findIndex(
      (prompt) =>
        prompt.span.outer[0] <= cursor.offset &&
        prompt.span.outer[1] >= cursor.offset,
    );
  // NOTE: We resolve state prompt rather than map prompt, so we can set
  // fileId while type system knows it's not nullish.
  const cursorStatePrompt: PlaygroundState.PromptCode | null =
    (typeof parsedPromptIdx === "number" &&
      mapFile?.prompts[parsedPromptIdx] && {
        type: "code",
        fileId: mapFile.id,
        prompt: mapFile?.prompts[parsedPromptIdx],
        reason: "cursor",
      }) ||
    null;

  // Now we resolve the pinned prompt.

  const pinnedDraft = pin?.type === "draft" && drafts[pin.promptId];

  if (pinnedDraft) {
    return {
      file: currentFileMeta,
      prompt: { type: "draft", prompt: pinnedDraft },
      prompts,
      pin,
      parseError,
    };
  }

  const pinMapFile =
    pin && (!pin.type || pin.type === "code")
      ? Object.values(map.files).find((file) => file.id === pin.fileId)
      : undefined;

  // If pin is set, we try to resolve it.
  if (pin && pinMapFile) {
    const pinPrompt = pinMapFile.prompts.find(
      (item) => item.id === pin.promptId,
    );

    // Pin prompt is found.
    if (pinPrompt) {
      // NOTE: We take precedence of cursor prompt so the client knows that
      // the prompt is focused even when it's pinned.
      const reason =
        pinPrompt.id === cursorStatePrompt?.prompt.id ? "cursor" : "pinned";

      return {
        file: pinMapFile.meta,
        prompt: {
          type: "code",
          fileId: pinMapFile.id,
          prompt: pinPrompt,
          reason,
        },
        prompts: buildStatePromptItems(pinMapFile, drafts),
        pin,
        parseError,
      };
    }
  }

  // There's no pin prompt nor cursor prompt, so we resolve null state.
  if (!cursorStatePrompt)
    return {
      file: currentFileMeta,
      prompt: null,
      prompts,
      pin: null,
      parseError: currentFileMeta ? parseError : null,
    };

  // Resolve state with cursor prompt.
  return {
    file: currentFileMeta,
    prompt: cursorStatePrompt,
    prompts,
    pin: null,
    parseError,
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
  ref: PlaygroundState.RefCode,
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
    source: string;
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
    source: string;
    timestamp: number;
    map: PlaygroundMap;
    file: EditorFile;
    parsedPrompts: readonly Prompt[];
  }
}

export function matchPlaygroundMapFile(
  props: MatchPlaygroundMapFile.Props,
): PlaygroundResolve.MatchFileResult {
  const { source, timestamp, map, file, parsedPrompts } = props;
  const byPath = map.files[file.path];

  if (byPath) {
    const {
      nextMapPrompts,
      matchedPromptsScore,
      matchingDistance,
      matchedCount,
      changed: matchChanged,
    } = matchPlaygroundMapPrompts({
      source,
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
        matchingDistance: matchingDistance,
        matchedCount,
        changed,
      };
    }
  }

  const byDistance = matchPlaygroundMapFileByDistance({
    source,
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
    prompts: parsedPrompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source,
        prompt,
        timestamp,
      }),
    ),
  };

  return {
    mapFile,
    changed: true,
    matchedPromptsScore: 0 as PlaygroundResolve.MatchedPromptsScore,
    matchingDistance: 0 as PlaygroundResolve.MatchingContentDistance,
    matchedCount: 0,
  };
}

//#endregion

//#region matchPlaygroundMapFileByDistance

export namespace MatchPlaygroundMapFileByDistance {
  export interface Props {
    source: string;
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
    adjustedMatchingScore: PlaygroundResolve.MatchingContentDistance;
  }
}

export function matchPlaygroundMapFileByDistance(
  props: MatchPlaygroundMapFileByDistance.Props,
): PlaygroundResolve.MatchFileResult | null {
  const { source, timestamp, file, map, parsedPrompts } = props;

  const candidates: MatchPlaygroundMapFileByDistance.Candidate[] = [];

  for (const mapFile of Object.values(map.files) as PlaygroundMap.File[]) {
    const result = matchPlaygroundMapPrompts({
      source,
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
            matchingDistance: candidate.result.matchingDistance,
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
    bestCandidate.result.matchingDistance >= MATCHING_FILE_CONTENT_THRESHOLD
  ) {
    const {
      mapFile: { id, meta, updatedAt },
      result: {
        nextMapPrompts,
        changed: bestMatchChanged,
        matchedPromptsScore,
        matchingDistance,
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
      matchingDistance: matchingDistance,
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
    source: string;
    timestamp: number;
    mapPrompts: readonly PlaygroundMap.PromptCode[];
    parsedPrompts: readonly Prompt[];
  }

  export interface Result extends PlaygroundResolve.MatchFileScores {
    nextMapPrompts: PlaygroundMap.PromptCode[];
    changed: boolean;
  }
}

export function matchPlaygroundMapPrompts(
  props: MatchPlaygroundMapPrompts.Props,
): MatchPlaygroundMapPrompts.Result {
  const { source, timestamp } = props;
  const byContent = matchPlaygroundMapPromptsByContent({
    source,
    unmatchedMapPrompts: new Set(props.mapPrompts),
    unmatchedParsedPrompts: new Set(props.parsedPrompts),
  });

  const byDistance = matchPlaygroundMapPromptsByDistance({
    source,
    timestamp,
    unmatchedMapPrompts: byContent.unmatchedMapPrompts,
    unmatchedParsedPrompts: byContent.unmatchedParsedPrompts,
  });

  const matchedMapPrompts = new Map([
    ...byContent.matchedMapPrompts,
    ...byDistance.matchedMapPrompts,
  ]);

  const matchingDistances: PlaygroundResolve.MatchingPromptsDistances = new Map(
    [...byContent.matchingDistances, ...byDistance.matchingDistances],
  );

  const nextMapPrompts: PlaygroundMap.PromptCode[] = [];
  let matchedCount = 0;

  for (const parsedPrompt of props.parsedPrompts) {
    const mapPrompt = matchedMapPrompts.get(parsedPrompt);

    if (mapPrompt) {
      nextMapPrompts.push(structuredClone(mapPrompt));
      matchedCount++;
    } else {
      const newMapPrompt = toPlaygroundMapPrompt({
        source,
        prompt: parsedPrompt,
        timestamp,
      });
      nextMapPrompts.push(newMapPrompt);
    }
  }

  const { unmatchedMapPrompts } = byDistance;

  const matchedPromptsScore = calcMatchedPromptsScore({
    matchedMapPrompts,
    unmatchedMapPrompts,
  });

  const matchingDistance = calcMatchedPromptsMatchingScore({
    matchingDistances,
    unmatchedMapPrompts,
  });

  const countChanged = props.mapPrompts.length !== nextMapPrompts.length;
  const idsChanged = props.mapPrompts.some(
    (prompt, index) => prompt.id !== nextMapPrompts[index]?.id,
  );
  const changed = matchingDistance !== 1 || countChanged || idsChanged;

  return {
    nextMapPrompts,
    matchedPromptsScore,
    matchingDistance,
    matchedCount,
    changed,
  };
}

//#endregion

//#region matchPlaygroundMapPromptsByContent

export function matchPlaygroundMapPromptsByContent(
  props: PlaygroundResolve.MatchPromptsProps,
): PlaygroundResolve.MatchPromptsResult {
  const { source } = props;
  const matchedMapPrompts = new Map<Prompt, PlaygroundMap.PromptCode>();
  const unmatchedMapPrompts = new Set(props.unmatchedMapPrompts);
  const unmatchedParsedPrompts = new Set(props.unmatchedParsedPrompts);

  const matchingDistances: PlaygroundResolve.MatchingPromptsDistances =
    new Map();

  unmatchedParsedPrompts.forEach((parsedPrompt) => {
    const parsedPromptContent = sliceSpan(
      props.source,
      parsedPrompt.span.outer,
    );

    unmatchedMapPrompts.forEach((mapPrompt) => {
      if (mapPrompt.content !== parsedPromptContent) return;

      const { nextMapPromptVars: vars } = matchPlaygroundMapPromptVars({
        source,
        mapPromptVars: mapPrompt.vars,
        parsedPromptVars: parsedPrompt.vars,
      });

      const updatedMapPrompt = toPlaygroundMapPrompt({
        source,
        id: mapPrompt.id,
        timestamp: mapPrompt.updatedAt,
        prompt: parsedPrompt,
        vars,
      });
      matchedMapPrompts.set(parsedPrompt, updatedMapPrompt);
      matchingDistances.set(
        mapPrompt,
        1 as PlaygroundResolve.MatchingContentDistance,
      );
      unmatchedMapPrompts.delete(mapPrompt);
      unmatchedParsedPrompts.delete(parsedPrompt);
    });
  });

  return {
    matchedMapPrompts,
    unmatchedMapPrompts,
    unmatchedParsedPrompts,
    matchingDistances,
  };
}

//#endregion

//#region matchPlaygroundMapPromptsByDistance

export namespace MatchPlaygroundMapPromptsByDistance {
  export interface Props extends PlaygroundResolve.MatchPromptsProps {
    timestamp: number;
  }

  export interface Candidate {
    parsedIndex: number;
    mapPrompt: PlaygroundMap.PromptCode;
    parsedPrompt: Prompt;
    matchingDistance: PlaygroundResolve.MatchingContentDistance;
  }
}

export function matchPlaygroundMapPromptsByDistance(
  props: MatchPlaygroundMapPromptsByDistance.Props,
): PlaygroundResolve.MatchPromptsResult {
  const { source, timestamp } = props;

  const unmatchedMapPrompts = new Set(props.unmatchedMapPrompts);
  const unmatchedParsedPrompts = new Set(props.unmatchedParsedPrompts);

  const candidates: MatchPlaygroundMapPromptsByDistance.Candidate[] = [];

  Array.from(unmatchedParsedPrompts).forEach((parsedPrompt, parsedIndex) => {
    const parsedExp = sliceSpan(source, parsedPrompt.span.outer);
    const parsedNormalized = normalizeContent(parsedExp);

    unmatchedMapPrompts.forEach((mapPrompt) => {
      const mapNormalized = normalizeContent(mapPrompt.content);
      const matchingDistance = calcMatchingContentDistance(
        mapNormalized,
        parsedNormalized,
      );

      if (matchingDistance <= MATCHING_PROMPT_CONTENT_THRESHOLD)
        candidates.push({
          parsedIndex,
          mapPrompt,
          parsedPrompt,
          matchingDistance,
        });
    });
  });

  candidates.sort((a, b) => {
    if (a.matchingDistance !== b.matchingDistance)
      return a.matchingDistance - b.matchingDistance;
    // TODO: There's no test for that, so add one
    return a.parsedIndex - b.parsedIndex;
  });

  const matchedMapPrompts = new Map<Prompt, PlaygroundMap.PromptCode>();
  const matchingDistances: PlaygroundResolve.MatchingPromptsDistances =
    new Map();

  candidates.forEach((candidate) => {
    const { mapPrompt, parsedPrompt, matchingDistance } = candidate;
    if (
      !unmatchedMapPrompts.has(mapPrompt) ||
      !unmatchedParsedPrompts.has(parsedPrompt)
    )
      return;

    const { nextMapPromptVars: vars } = matchPlaygroundMapPromptVars({
      source,
      mapPromptVars: mapPrompt.vars,
      parsedPromptVars: parsedPrompt.vars,
    });

    const nextMapPrompt: PlaygroundMap.PromptCode = toPlaygroundMapPrompt({
      prompt: parsedPrompt,
      source,
      id: mapPrompt.id,
      timestamp,
      vars,
    });

    matchedMapPrompts.set(parsedPrompt, nextMapPrompt);
    matchingDistances.set(nextMapPrompt, matchingDistance);
    unmatchedMapPrompts.delete(mapPrompt);
    unmatchedParsedPrompts.delete(parsedPrompt);
  });

  return {
    matchedMapPrompts,
    unmatchedMapPrompts,
    unmatchedParsedPrompts,
    matchingDistances,
  };
}

//#endregion

//#region calcMatchingPromptsScore

export namespace CalcMatchingPromptsScore {
  export interface Props {
    matchedMapPrompts: Map<Prompt, PlaygroundMap.PromptCode>;
    unmatchedMapPrompts: Set<PlaygroundMap.PromptCode>;
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

//#region Map prompt vars

//#region matchPlaygroundMapPromptVars

export namespace MatchPlaygroundMapPromptVars {
  export interface Props {
    source: string;
    mapPromptVars: readonly PlaygroundMap.PromptVar[];
    parsedPromptVars: readonly PromptVar[];
  }

  export interface Result {
    nextMapPromptVars: PlaygroundMap.PromptVar[];
  }
}

export function matchPlaygroundMapPromptVars(
  props: MatchPlaygroundMapPromptVars.Props,
): MatchPlaygroundMapPromptVars.Result {
  const { source, mapPromptVars, parsedPromptVars } = props;
  const nextMapPromptVars: PlaygroundMap.PromptVar[] = [];

  const byContent = matchPlaygroundMapPromptVarsByContent({
    source,
    matchedMapPromptVarExps: {},
    unmatchedMapPromptVars: new Set(mapPromptVars),
    unmatchedParsedPromptVars: new Set(parsedPromptVars),
  });

  const byDistance = matchPlaygroundMapPromptVarsByDistance({
    source,
    matchedMapPromptVarExps: byContent.matchedMapPromptVarExps,
    unmatchedMapPromptVars: byContent.unmatchedMapPromptVars,
    unmatchedParsedPromptVars: byContent.unmatchedParsedPromptVars,
  });

  const matchedMapPromptVars = new Map([
    ...byContent.matchedMapPromptVars,
    ...byDistance.matchedMapPromptVars,
  ]);

  const matchedMapPromptVarExps: PlaygroundResolve.MatchedMapPromptVarExps = {};

  for (const parsedVar of parsedPromptVars) {
    const mapVar = matchedMapPromptVars.get(parsedVar);
    if (mapVar) {
      nextMapPromptVars.push(structuredClone(mapVar));
    } else {
      const parsedVarContent = sliceVarContent(source, parsedVar);
      const mapPromptVarId = (matchedMapPromptVarExps[parsedVarContent] ||=
        buildMapPromptVarId());
      nextMapPromptVars.push(
        toPlaygroundMapVar(source, parsedVar, mapPromptVarId),
      );
    }
  }

  return { nextMapPromptVars };
}

//#endregion

//#region matchPlaygroundMapPromptVarsByContent

export function matchPlaygroundMapPromptVarsByContent(
  props: PlaygroundResolve.MatchPromptVarsProps,
): PlaygroundResolve.MatchPromptVarsResult {
  const { source } = props;
  const matchedMapPromptVars = new Map<PromptVar, PlaygroundMap.PromptVar>();
  const matchedMapPromptVarExps = { ...props.matchedMapPromptVarExps };
  const unmatchedMapPromptVars = new Set(props.unmatchedMapPromptVars);
  const unmatchedParsedPromptVars = new Set(props.unmatchedParsedPromptVars);

  unmatchedParsedPromptVars.forEach((parsedVar) => {
    const parsedVarContent = sliceVarContent(source, parsedVar);

    // First, map all existing map prompt vars with the same expression.
    for (const mapVar of unmatchedMapPromptVars) {
      const mapVarContent = getPlaygroundMapVarContent(mapVar);

      const mapVarId = matchedMapPromptVarExps[parsedVarContent] || mapVar.id;
      if (mapVarContent !== parsedVarContent) continue;
      const nextMapVar = toPlaygroundMapVar(source, parsedVar, mapVarId);
      matchedMapPromptVars.set(parsedVar, nextMapVar);
      matchedMapPromptVarExps[parsedVarContent] = nextMapVar.id;
      unmatchedMapPromptVars.delete(mapVar);
      unmatchedParsedPromptVars.delete(parsedVar);
      // Stop processing after the first match.
      break;
    }

    // If not matched with map prompt but the id is assigned to the expression,
    // then create a new mapping reusing the existing id.
    matchParsedFromExpsMap({
      source,
      parsedVar,
      matchedMapPromptVarExps,
      unmatchedParsedPromptVars,
      unmatchedMapPromptVars,
      matchedMapPromptVars,
    });
  });

  return {
    matchedMapPromptVars,
    matchedMapPromptVarExps,
    unmatchedMapPromptVars,
    unmatchedParsedPromptVars,
  };
}

//#endregion

//#region matchPlaygroundMapPromptVarsByDistance

export namespace MatchPlaygroundMapPromptVarsByDistance {
  export interface Candidate {
    parsedVar: PromptVar;
    mapVar: PlaygroundMap.PromptVar;
    matchingDistance: PlaygroundResolve.MatchingContentDistance;
  }
}

export function matchPlaygroundMapPromptVarsByDistance(
  props: PlaygroundResolve.MatchPromptVarsProps,
): PlaygroundResolve.MatchPromptVarsResult {
  const { source } = props;
  const matchedMapPromptVars = new Map<PromptVar, PlaygroundMap.PromptVar>();
  const matchedMapPromptVarExps = { ...props.matchedMapPromptVarExps };
  const unmatchedMapPromptVars = new Set(props.unmatchedMapPromptVars);
  const unmatchedParsedPromptVars = new Set(props.unmatchedParsedPromptVars);

  const candidates: MatchPlaygroundMapPromptVarsByDistance.Candidate[] = [];

  unmatchedParsedPromptVars.forEach((parsedVar) => {
    const parsedVarContent = sliceVarContent(source, parsedVar);
    const parsedNormalized = normalizeContent(parsedVarContent);

    for (const mapVar of unmatchedMapPromptVars) {
      const mapVarContent = getPlaygroundMapVarContent(mapVar);
      const mapNormalized = normalizeContent(mapVarContent);

      const matchingDistance = calcMatchingContentDistance(
        mapNormalized,
        parsedNormalized,
      );
      if (matchingDistance <= MATCHING_VAR_EXP_THRESHOLD) {
        candidates.push({ parsedVar, mapVar, matchingDistance });
      }
    }
  });

  candidates.sort((a, b) => {
    if (a.matchingDistance !== b.matchingDistance)
      return a.matchingDistance - b.matchingDistance;
    return 0;
  });

  candidates.forEach((candidate) => {
    const { mapVar, parsedVar, matchingDistance } = candidate;
    if (
      !unmatchedMapPromptVars.has(mapVar) ||
      !unmatchedParsedPromptVars.has(parsedVar)
    )
      return;

    const parsedVarContent = sliceVarContent(source, parsedVar);
    const mapVarId = matchedMapPromptVarExps[parsedVarContent] || mapVar.id;

    const nextMapVar: PlaygroundMap.PromptVar = toPlaygroundMapVar(
      source,
      parsedVar,
      mapVarId,
    );

    matchedMapPromptVars.set(parsedVar, nextMapVar);
    matchedMapPromptVarExps[parsedVarContent] = nextMapVar.id;
    unmatchedMapPromptVars.delete(mapVar);
    unmatchedParsedPromptVars.delete(parsedVar);

    unmatchedParsedPromptVars.forEach((parsedVar) => {
      // Find and match remaining unmatched parsed vars that have existing
      // mapped ids.
      matchParsedFromExpsMap({
        source,
        parsedVar,
        matchedMapPromptVarExps,
        unmatchedParsedPromptVars,
        unmatchedMapPromptVars,
        matchedMapPromptVars,
      });
    });
  });

  return {
    matchedMapPromptVars,
    matchedMapPromptVarExps,
    unmatchedMapPromptVars,
    unmatchedParsedPromptVars,
  };
}

//#endregion

//#endregion

//#region Utils

const WHITESPACE_RE = /\s+/g;
const NEWLINE_RE = /\r?\n/;

function normalizeContent(value: string): string {
  return value.trim().replace(WHITESPACE_RE, " ");
}

function calcMatchingContentDistance(
  a: string,
  b: string,
): PlaygroundResolve.MatchingContentDistance {
  const maxLength = Math.max(a.length, b.length);
  if (a === b || maxLength === 0)
    return 0 as PlaygroundResolve.MatchingContentDistance;
  return (distance(a, b) /
    maxLength) as PlaygroundResolve.MatchingContentDistance;
}

namespace CalcMatchedPromptsMatchingScore {
  export interface Props {
    matchingDistances: PlaygroundResolve.MatchingPromptsDistances;
    unmatchedMapPrompts: Set<PlaygroundMap.PromptCode>;
  }
}

function calcMatchedPromptsMatchingScore(
  props: CalcMatchedPromptsMatchingScore.Props,
): PlaygroundResolve.MatchingContentDistance {
  const { matchingDistances, unmatchedMapPrompts } = props;
  const total = matchingDistances.size + unmatchedMapPrompts.size;
  const sum = [...matchingDistances.values()].reduce(
    (sum, score) => sum + score,
    0,
  );
  return (sum / total) as PlaygroundResolve.MatchingContentDistance;
}

export namespace AdjustMatchedPromptsMatchingScoreToMatchedCount {
  export interface Props {
    matchingDistance: PlaygroundResolve.MatchingContentDistance;
    matchedCount: number;
    maxMatchedCount: number;
  }
}

function adjustMatchedPromptsMatchingScoreToMatchedCount(
  props: AdjustMatchedPromptsMatchingScoreToMatchedCount.Props,
): PlaygroundResolve.MatchingContentDistance {
  const { matchingDistance, matchedCount, maxMatchedCount } = props;
  if (!matchedCount || !maxMatchedCount)
    return 0 as PlaygroundResolve.MatchingContentDistance;
  const countFactor = matchedCount / maxMatchedCount;
  return (matchingDistance *
    countFactor) as PlaygroundResolve.MatchingContentDistance;
}

function truncatePromptContent(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "";
  const firstLine = trimmed.split(NEWLINE_RE)[0] ?? "";
  if (firstLine.length <= PROMPT_PREVIEW_LENGTH) return firstLine;
  return `${firstLine.slice(0, PROMPT_PREVIEW_LENGTH - 1)}…`;
}

function buildStatePromptItems(
  mapFile: PlaygroundMap.File | undefined,
  drafts: Store.Drafts,
): PlaygroundState.PromptItem[] {
  return (
    mapFile
      ? mapFile.prompts.map(buildStatePromptItemCode.bind(null, mapFile.id))
      : []
  ).concat(Object.values(drafts).map(buildStatePromptItemDraft));
}

export namespace buildStatePromptItemCode {
  export interface Props {
    fileId: PlaygroundMap.FileId;
    prompt: PlaygroundMap.Prompt;
  }
}

function buildStatePromptItemCode(
  fileId: PlaygroundMap.FileId,
  prompt: PlaygroundMap.PromptCode,
): PlaygroundState.PromptItem {
  return {
    v: 1,
    type: "code",
    fileId,
    promptId: prompt.id,
    preview: truncatePromptContent(prompt.content),
  };
}

function buildStatePromptItemDraft(
  prompt: PlaygroundMap.PromptDraft,
): PlaygroundState.PromptItem {
  return {
    v: 1,
    type: "draft",
    promptId: prompt.id,
    preview: truncatePromptContent(prompt.content),
    updatedAt: prompt.updatedAt,
  };
}

export namespace MatchParsedFromExpsMap {
  export interface Props extends PlaygroundResolve.MatchPromptVarsProps {
    source: string;
    parsedVar: PromptVar;
    matchedMapPromptVars: Map<PromptVar, PlaygroundMap.PromptVar>;
  }
}

function matchParsedFromExpsMap(props: MatchParsedFromExpsMap.Props) {
  const {
    source,
    parsedVar,
    matchedMapPromptVarExps,
    unmatchedParsedPromptVars,
    matchedMapPromptVars,
  } = props;

  const parsedVarContent = sliceVarContent(source, parsedVar);

  const mapVarId = matchedMapPromptVarExps[parsedVarContent];
  if (unmatchedParsedPromptVars.has(parsedVar) && mapVarId) {
    const nextMapVar: PlaygroundMap.PromptVarLatest = toPlaygroundMapVar(
      source,
      parsedVar,
      mapVarId,
    );
    matchedMapPromptVars.set(parsedVar, nextMapVar);
    unmatchedParsedPromptVars.delete(parsedVar);
  }
}

function sliceVarContent(source: string, parsedVar: PromptVar): string {
  // if ("v" in parsedVar && parsedVar.v === 1) return parsedVar.exp;
  return sliceSpan(source, parsedVar.span.outer);
}

// function sliceMapPromptExp(
//   source: string,
//   mapPrompt: PlaygroundMap.PromptCode,
// ): string {
//   if ("v" in mapPrompt && mapPrompt.v === 1) return mapPrompt.content;
//   return sliceSpan(source, mapPrompt.span.outer);
// }

//#endregion
