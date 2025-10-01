import leven from "leven";

export type PromptInputSource = "manual" | "dataset";
export type DatasetMode = "row" | "range" | "all";
export type ResultsLayout = "horizontal" | "vertical" | "carousel";

export interface PromptMeta {
  file: string;
  index: number | null;
  span: { start: number; end: number };
  vars: string[];
  source: string;
}

export interface PlaygroundModelConfigState {
  key: string;
  providerId: string | null;
  modelId: string | null;
  label?: string;
  generationOptions: Record<string, unknown>;
  reasoning: {
    enabled: boolean;
    effort: "low" | "medium" | "high";
    budgetTokens: number | "";
  };
  toolsJson: string;
  providerOptionsJson: string;
  attachments: Array<{
    path: string;
    name: string;
    mime?: string;
    dataBase64?: string;
  }>;
}

export interface PlaygroundState {
  modelConfigs: PlaygroundModelConfigState[];
  variables: Record<string, string>;
  csv?: {
    path: string | null;
    header: string[] | null;
    rows: string[][];
    selectedRowIdx: number | null;
  };
  inputSource: PromptInputSource;
  datasetMode: DatasetMode;
  range?: { start: string; end: string };
  execution?: {
    results: Array<Record<string, unknown>>;
    error: string | null;
    timestamp?: number;
  };
  layout?: ResultsLayout;
  activeResultIndex?: number;
}

export interface PersistedPromptState {
  id: string;
  meta: PromptMeta & { updatedAt: number };
  data: PlaygroundState;
}

const STORAGE_KEY = "mindrig.playground.prompts";

function readRaw(): PersistedPromptState[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) => entry && typeof entry === "object");
  } catch (error) {
    console.error(
      "Failed to read playground persistence",
      JSON.stringify({ error: String(error) }),
    );
    return [];
  }
}

function writeRaw(entries: PersistedPromptState[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error(
      "Failed to write playground persistence",
      JSON.stringify({ error: String(error) }),
    );
  }
}

function normaliseVars(vars: string[]): string[] {
  return [...vars]
    .filter(Boolean)
    .map((v) => v.trim())
    .sort();
}

function matchScore(meta: PromptMeta, entry: PersistedPromptState): number {
  if (entry.meta.file !== meta.file) return Number.POSITIVE_INFINITY;

  if (
    entry.meta.span.start === meta.span.start &&
    entry.meta.span.end === meta.span.end
  )
    return 0;

  if (entry.meta.source === meta.source) return 0.1;

  const sameIndex = entry.meta.index === meta.index ? 0 : 0.5;
  const varsMatch =
    JSON.stringify(normaliseVars(entry.meta.vars)) ===
    JSON.stringify(normaliseVars(meta.vars))
      ? 0
      : 0.2;

  const distance = leven(entry.meta.source || "", meta.source || "");
  const normaliser = Math.max(
    entry.meta.source?.length ?? 1,
    meta.source?.length ?? 1,
    1,
  );
  const similarity = distance / normaliser;

  const spanDelta =
    Math.abs(entry.meta.span.start - meta.span.start) /
      Math.max(meta.span.start + 1, 1) +
    Math.abs(entry.meta.span.end - meta.span.end) /
      Math.max(meta.span.end + 1, 1);

  return 1 + similarity + sameIndex + varsMatch + spanDelta;
}

export function loadPromptState(
  meta: PromptMeta,
): PersistedPromptState | undefined {
  const entries = readRaw();
  if (entries.length === 0) return undefined;
  let best: PersistedPromptState | undefined;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const entry of entries) {
    const score = matchScore(meta, entry as PersistedPromptState);
    if (score < bestScore) {
      best = entry as PersistedPromptState;
      bestScore = score;
    }
  }

  if (bestScore === Number.POSITIVE_INFINITY) return undefined;
  return best;
}

export function savePromptState(
  meta: PromptMeta,
  data: PlaygroundState,
): PersistedPromptState {
  const entries = readRaw();
  const timestamp = Date.now();
  let updated: PersistedPromptState | undefined;
  const nextEntries = entries.map((entry) => {
    if (entry.meta.file !== meta.file) return entry;
    if (!updated) {
      const score = matchScore(meta, entry as PersistedPromptState);
      if (score < 0.15 || entry.meta.index === meta.index) {
        updated = {
          ...entry,
          meta: { ...meta, updatedAt: timestamp },
          data,
        } as PersistedPromptState;
        return updated;
      }
    }
    return entry;
  });

  if (!updated) {
    updated = {
      id: `${meta.file}:${meta.span.start}-${meta.span.end}:${timestamp}`,
      meta: { ...meta, updatedAt: timestamp },
      data,
    };
    nextEntries.push(updated);
  }

  writeRaw(nextEntries as PersistedPromptState[]);
  return updated;
}

export function removePromptState(id: string): void {
  const entries = readRaw();
  const next = entries.filter((entry) => entry.id !== id);
  writeRaw(next);
}

export function touchPromptState(
  record: PersistedPromptState | undefined,
  meta: PromptMeta,
): PersistedPromptState | undefined {
  if (!record) return undefined;
  const updated: PersistedPromptState = {
    ...record,
    meta: { ...meta, updatedAt: Date.now() },
  };
  const entries = readRaw();
  const next = entries.map((entry) =>
    entry.id === updated.id ? updated : (entry as PersistedPromptState),
  );
  writeRaw(next as PersistedPromptState[]);
  return updated;
}
