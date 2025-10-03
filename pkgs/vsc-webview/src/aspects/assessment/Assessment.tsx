import { useMessage, useOn } from "@/aspects/message/messageContext";
import { useModels } from "@/aspects/models/Context";
import type { Prompt, PromptVar } from "@mindrig/types";
import JsonView, { ShouldExpandNodeInitially } from "@uiw/react-json-view";
import { buildRunsAndSettings, computeVariablesFromRow } from "@wrkspc/dataset";
import { Button, Select } from "@wrkspc/ds";
import type { AttachmentInput, GenerationOptionsInput } from "@wrkspc/model";
import {
  selectedModelCapabilities as capsForEntry,
  filterAttachmentsForCapabilities,
  mergeProviderOptionsWithReasoning,
  providerFromEntry,
  providerLogoUrl,
} from "@wrkspc/model";
import { extractPromptText, substituteVariables } from "@wrkspc/prompt";
import type {
  VscMessageAttachments,
  VscMessageDataset,
  VscMessagePromptRun,
} from "@wrkspc/vsc-message";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { parseString as parseCsvString } from "smolcsv";
import type { ModelStatus } from "./components/ModelStatusDot";
import { ModelStatusDot } from "./components/ModelStatusDot";
import { StreamingMarkdown } from "./components/StreamingMarkdown";
import type { AvailableModel } from "@/aspects/models/Context";
import type { ProviderModelWithScore } from "./modelSorting";
import {
  compareProviderModelEntries,
  computeRecommendationWeightsForProvider,
  modelKeyFromId,
  normaliseProviderId,
  OFFLINE_MODEL_RECOMMENDATIONS,
  parseLastUpdatedMs,
  PROVIDER_POPULARITY,
} from "./modelSorting";
import {
  loadPromptState,
  PersistedPromptState,
  PlaygroundState,
  PromptMeta,
  ResultsLayout,
  savePromptState,
} from "./persistence";
import {
  appendTextChunk,
  createEmptyStreamingState,
  type AssessmentStreamingResult,
  type AssessmentStreamingState,
  type StreamingRunCompleted,
  type StreamingRunError,
  type StreamingRunResultCompleted,
  type StreamingRunStarted,
  type StreamingRunUpdate,
} from "./streamingTypes";

const shouldExpandNodeInitially: ShouldExpandNodeInitially<object> = (
  isExpanded,
  props,
) => {
  const { value, level } = props;
  const isArray = Array.isArray(value);
  const isObject = typeof value === "object" && value !== null && !isArray;
  if (isArray) return isExpanded || (Array.isArray(value) && value.length > 5);
  if (isObject && level > 3) return true;
  return isExpanded;
};

interface ModelConfigState {
  key: string;
  providerId: string | null;
  modelId: string | null;
  label?: string;
  generationOptions: GenerationOptionsInput;
  reasoning: {
    enabled: boolean;
    effort: "low" | "medium" | "high";
    budgetTokens: number | "";
  };
  toolsJson: string;
  providerOptionsJson: string;
  attachments: AttachmentInput[];
}

interface ModelConfigErrors {
  provider?: string | null;
  model?: string | null;
  tools?: string | null;
  providerOptions?: string | null;
}

interface RunResult {
  success: boolean;
  runId?: string | null;
  resultId?: string;
  runLabel?: string;
  label?: string;
  prompt?: string | null;
  text?: string | null;
  textParts?: string[];
  streaming?: boolean;
  isLoading?: boolean;
  nonStreamingNote?: string | null;
  request?: object | null;
  response?: object | null;
  usage?: any;
  totalUsage?: any;
  steps?: any;
  finishReason?: any;
  warnings?: any;
  error?: string | null;
  model?: {
    key: string;
    id: string | null;
    providerId: string | null;
    label?: string | null;
    settings?: any;
  };
}

interface ExecutionState {
  isLoading: boolean;
  results: RunResult[];
  error: string | null;
  timestamp?: number;
  runId?: string | null;
  promptId?: string | null;
  startedAt?: number | null;
  completedAt?: number | null;
}

function createModelConfigKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return `model-${crypto.randomUUID()}`;
  return `model-${Math.random().toString(36).slice(2)}`;
}

function providerLabel(providerId: string): string {
  if (!providerId) return "";
  return providerId
    .split(/[-_\\s]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export namespace Assessment {
  export interface Props {
    prompt: Prompt | undefined;
    vercelGatewayKey: string | undefined | null;
    fileContent?: string | undefined;
    promptIndex?: number | null;
  }
}

export function Assessment({
  prompt,
  vercelGatewayKey,
  fileContent,
  promptIndex = null,
}: Assessment.Props) {
  const { send } = useMessage();
  const [modelConfigs, setModelConfigs] = useState<ModelConfigState[]>([]);
  const [expandedModelKey, setExpandedModelKey] = useState<string | null>(null);
  const [modelErrors, setModelErrors] = useState<
    Record<string, ModelConfigErrors>
  >({});
  const attachmentTargetKeyRef = useRef<string | null>(null);

  const [variables, setVariables] = useState<Record<string, string>>({});
  const [csvPath, setCsvPath] = useState<string | null>(null);
  const [csvHeader, setCsvHeader] = useState<string[] | null>(null);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [selectedRowIdx, setSelectedRowIdx] = useState<number | null>(null);

  const [executionState, setExecutionState] = useState<ExecutionState>({
    isLoading: false,
    results: [],
    error: null,
  });
  const [streamingState, setStreamingState] =
    useState<AssessmentStreamingState>(() => createEmptyStreamingState());
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [isStopping, setIsStopping] = useState(false);
  const activeRunIdRef = useRef<string | null>(null);
  const [inputSource, setInputSource] = useState<"manual" | "dataset">(
    "manual",
  );
  const [datasetMode, setDatasetMode] = useState<"row" | "range" | "all">(
    "row",
  );
  const [rangeStart, setRangeStart] = useState<string>("");
  const [rangeEnd, setRangeEnd] = useState<string>("");

  const [resultsLayout, setResultsLayout] = useState<ResultsLayout>("vertical");
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const [collapsedResults, setCollapsedResults] = useState<
    Record<number, boolean>
  >({});
  const [viewTab, setViewTab] = useState<Record<number, "rendered" | "raw">>(
    {},
  );
  const [expandedRequest, setExpandedRequest] = useState<
    Record<number, boolean>
  >({});
  const [expandedResponse, setExpandedResponse] = useState<
    Record<number, boolean>
  >({});
  const [collapsedModelSettings, setCollapsedModelSettings] = useState<
    Record<number, boolean>
  >({});
  const streamingToggleId = useId();
  const convertStreamingStateToResults = useCallback(
    (state: AssessmentStreamingState): RunResult[] => {
      if (!state.order.length) return [];
      return state.order.map((resultId) => {
        const streamingResult = state.results[resultId];
        if (!streamingResult) {
          const fallback: RunResult = {
            success: false,
            runId: state.runId ?? null,
            resultId,
            runLabel: "",
            label: resultId,
            prompt: null,
            text: null,
            textParts: [],
            streaming: state.streaming,
            isLoading: false,
            nonStreamingNote: null,
            error: "Result missing",
          };
          return fallback;
        }

        const metadata = streamingResult.metadata ?? {};
        const assembledText =
          typeof streamingResult.fullText === "string"
            ? streamingResult.fullText
            : streamingResult.textParts.join("");

        const runResult: RunResult = {
          success:
            streamingResult.success === null ? true : streamingResult.success,
          runId: state.runId ?? null,
          resultId: streamingResult.id,
          runLabel: streamingResult.runLabel,
          label: streamingResult.label,
          prompt: null,
          text: assembledText.length > 0 ? assembledText : null,
          textParts: [...streamingResult.textParts],
          streaming: streamingResult.streaming,
          isLoading: streamingResult.loading,
          nonStreamingNote: streamingResult.nonStreamingNote ?? null,
          error: streamingResult.error,
          model: {
            key: streamingResult.model.key,
            id: streamingResult.model.id,
            providerId: streamingResult.model.providerId,
            label: streamingResult.model.label ?? null,
            settings: streamingResult.model.settings,
          },
        };

        if (metadata.request !== undefined)
          runResult.request = metadata.request ?? null;
        if (metadata.response !== undefined)
          runResult.response = metadata.response ?? null;
        if (metadata.usage !== undefined)
          runResult.usage = metadata.usage ?? null;
        if (metadata.totalUsage !== undefined)
          runResult.totalUsage = metadata.totalUsage ?? null;
        if (metadata.steps !== undefined)
          runResult.steps = metadata.steps ?? null;
        if (metadata.finishReason !== undefined)
          runResult.finishReason = metadata.finishReason ?? null;
        if (metadata.warnings !== undefined)
          runResult.warnings = metadata.warnings ?? null;

        return runResult;
      });
    },
    [],
  );

  const updateStreamingState = useCallback(
    (
      updater: (previous: AssessmentStreamingState) => AssessmentStreamingState,
      overrides?: Partial<
        Pick<ExecutionState, "isLoading" | "error" | "timestamp">
      >,
    ) => {
      setStreamingState((prev) => {
        const next = updater(prev);
        setExecutionState((prevExec) => {
          const derivedResults = convertStreamingStateToResults(next);
          const loadingFromState = next.order.some(
            (id) => next.results[id]?.loading,
          );
          const timestampCandidate =
            overrides?.timestamp !== undefined
              ? overrides.timestamp
              : (next.completedAt ?? prevExec.timestamp);

          const nextExecutionState: ExecutionState = {
            isLoading:
              overrides?.isLoading !== undefined
                ? overrides.isLoading
                : loadingFromState,
            results: derivedResults,
            error: overrides?.error ?? next.error ?? null,
            runId: next.runId,
            promptId: next.promptId,
            startedAt: next.startedAt,
            completedAt: next.completedAt,
          };

          if (timestampCandidate !== undefined)
            nextExecutionState.timestamp = timestampCandidate;
          else if (prevExec.timestamp !== undefined)
            nextExecutionState.timestamp = prevExec.timestamp;

          return nextExecutionState;
        });
        return next;
      });
    },
    [convertStreamingStateToResults],
  );

  const resetPerRunUiState = useCallback(() => {
    setCollapsedResults({});
    setCollapsedModelSettings({});
    setExpandedRequest({});
    setExpandedResponse({});
    setViewTab({});
    setActiveResultIndex(0);
  }, []);

  // Handlers for streaming lifecycle events are defined after promptId is available.

  const persistedStateRef = useRef<PersistedPromptState | undefined>(undefined);
  const [isHydrated, setIsHydrated] = useState(false);

  const {
    gateway,
    gatewayModels,
    gatewayError,
    dotDevError,
    isDotDevFallback: modelsDevFallback,
    isLoading: modelsLoading,
    providers: modelsDevProviders,
    modelsByProvider,
    getModel: getModelsDevMeta,
  } = useModels();
  const modelsDevLoading = modelsLoading;

  const manualModelFallback = useMemo<AvailableModel[]>(() => {
    return Object.entries(OFFLINE_MODEL_RECOMMENDATIONS).flatMap(
      ([providerId, entries]) =>
        Object.keys(entries).map((modelId) => {
          const meta = getModelsDevMeta(providerId, modelId) as
            | { name?: string }
            | undefined;
          return {
            id: modelId,
            name: meta?.name ?? modelId,
            specification: { provider: providerId },
          };
        }),
    );
  }, [getModelsDevMeta]);

  const models = useMemo<AvailableModel[]>(() => {
    if (gatewayModels && gatewayModels.length > 0) return gatewayModels;
    return manualModelFallback;
  }, [gatewayModels, manualModelFallback]);

  const modelsError = useMemo(() => {
    if (gateway?.response.status === "error") return gateway.response.message;
    return null;
  }, [gateway]);

  const modelStatus = useMemo<ModelStatus>(() => {
    if (gateway?.response.status === "error" || dotDevError) return "error";
    if (modelsLoading) return "loading";
    return "success";
  }, [dotDevError, gateway, modelsLoading]);

  useEffect(() => {
    send({ type: "settings-streaming-get" });
  }, [send]);

  useEffect(() => {
    if (resultsLayout !== "vertical") setCollapsedResults({});
  }, [resultsLayout]);

  const promptId = prompt
    ? `${prompt.file}:${prompt.span.outer.start}-${prompt.span.outer.end}`
    : null;

  const handleRunStarted = useCallback(
    (payload: StreamingRunStarted) => {
      if (payload.promptId !== promptId) return;

      activeRunIdRef.current = payload.runId;
      resetPerRunUiState();
      setIsStopping(false);

      const results: Record<string, AssessmentStreamingResult> = {};
      const nonStreamingCopy =
        "Streaming is unavailable. Results will appear when the run completes.";
      const runStreamingEnabled = payload.streaming !== false;

      for (const shell of payload.results) {
        results[shell.resultId] = {
          id: shell.resultId,
          label: shell.label,
          runLabel: shell.runLabel,
          model: shell.model,
          streaming: shell.streaming,
          textParts: [],
          fullText: null,
          success: null,
          error: null,
          loading: true,
          nonStreamingNote:
            runStreamingEnabled && shell.streaming === false
              ? nonStreamingCopy
              : null,
          metadata: {},
        };
      }

      updateStreamingState(
        () => ({
          runId: payload.runId,
          promptId: payload.promptId,
          streaming: payload.streaming,
          startedAt: payload.timestamp,
          completedAt: null,
          results,
          order: payload.results
            .map((r) => r.resultId)
            .filter((id): id is string => typeof id === "string"),
          error: null,
        }),
        { isLoading: true, error: null, timestamp: payload.timestamp },
      );
    },
    [promptId, resetPerRunUiState, updateStreamingState],
  );

  const handleRunUpdate = useCallback(
    (payload: StreamingRunUpdate) => {
      if (payload.promptId !== promptId) return;
      if (activeRunIdRef.current && payload.runId !== activeRunIdRef.current)
        return;

      const resultId = payload.resultId;
      if (!resultId) return;

      updateStreamingState((prev) => {
        if (prev.runId && payload.runId && prev.runId !== payload.runId)
          return prev;

        const target = prev.results[resultId];
        if (!target) return prev;

        let updated: AssessmentStreamingResult = target;
        const delta = payload.delta;

        if (delta.type === "text")
          updated = appendTextChunk(target, delta.text);

        const nextResults = {
          ...prev.results,
          [resultId]: updated,
        };

        return { ...prev, results: nextResults };
      });
    },
    [promptId, updateStreamingState],
  );

  const handleRunCompleted = useCallback(
    (payload: StreamingRunCompleted) => {
      if (payload.promptId !== promptId) return;
      if (activeRunIdRef.current && payload.runId !== activeRunIdRef.current)
        return;

      activeRunIdRef.current = null;
      setIsStopping(false);

      updateStreamingState(
        (prev) => {
          if (prev.runId && payload.runId && prev.runId !== payload.runId)
            return prev;

          const nextResults = { ...prev.results };
          for (const result of payload.results) {
            const resultId = result.resultId;
            if (!resultId) continue;
            const existing = nextResults[resultId];
            const baseStreamingFlag = existing?.streaming ?? prev.streaming;
            const resolvedModel = result.model ?? existing?.model ?? null;
            if (!resolvedModel) continue;
            const base: AssessmentStreamingResult = existing
              ? { ...existing }
              : {
                  id: result.resultId,
                  label: result.label ?? result.resultId,
                  runLabel: result.runLabel ?? "",
                  model: resolvedModel,
                  streaming: baseStreamingFlag ?? true,
                  textParts: [],
                  fullText: null,
                  success: null,
                  error: null,
                  loading: true,
                  nonStreamingNote: null,
                  metadata: {},
                };

            const finalText =
              typeof result.text === "string"
                ? result.text
                : (base.fullText ?? null);

            base.fullText = finalText;
            base.textParts = finalText ? [finalText] : base.textParts;
            base.success = result.success;
            base.error = result.error ?? null;
            base.loading = false;

            const mergedMetadata = {
              ...(base.metadata ?? {}),
            } as NonNullable<AssessmentStreamingResult["metadata"]>;
            if (result.usage !== undefined)
              mergedMetadata.usage = result.usage ?? null;
            if (result.totalUsage !== undefined)
              mergedMetadata.totalUsage = result.totalUsage ?? null;
            if (result.steps !== undefined)
              mergedMetadata.steps = result.steps ?? null;
            if (result.finishReason !== undefined)
              mergedMetadata.finishReason = result.finishReason ?? null;
            if (result.warnings !== undefined)
              mergedMetadata.warnings = result.warnings ?? null;
            if (result.request !== undefined)
              mergedMetadata.request = result.request ?? null;
            if (result.response !== undefined)
              mergedMetadata.response = result.response ?? null;

            base.metadata = mergedMetadata;

            nextResults[resultId] = base;
          }

          return {
            ...prev,
            runId: null,
            results: nextResults,
            completedAt: payload.timestamp,
            error: payload.success ? null : (prev.error ?? null),
          };
        },
        { isLoading: false, timestamp: payload.timestamp },
      );
    },
    [promptId, updateStreamingState],
  );

  const handleRunResultCompleted = useCallback(
    (payload: StreamingRunResultCompleted) => {
      if (payload.promptId !== promptId) return;

      updateStreamingState((prev) => {
        if (prev.runId && payload.runId && prev.runId !== payload.runId)
          return prev;

        const resultId = payload.result.resultId;
        const existing = prev.results[resultId];
        if (!existing) return prev;

        const metadata = { ...(existing.metadata ?? {}) };
        if (payload.result.request !== undefined)
          metadata.request = payload.result.request ?? null;
        if (payload.result.response !== undefined)
          metadata.response = payload.result.response ?? null;
        if (payload.result.usage !== undefined)
          metadata.usage = payload.result.usage ?? null;
        if (payload.result.totalUsage !== undefined)
          metadata.totalUsage = payload.result.totalUsage ?? null;
        if (payload.result.steps !== undefined)
          metadata.steps = payload.result.steps ?? null;
        if (payload.result.finishReason !== undefined)
          metadata.finishReason = payload.result.finishReason ?? null;
        if (payload.result.warnings !== undefined)
          metadata.warnings = payload.result.warnings ?? null;

        const textProvided = payload.result.text !== undefined;
        const providedText =
          textProvided && payload.result.text !== undefined
            ? payload.result.text
            : null;
        const finalText =
          textProvided && providedText !== null
            ? providedText
            : existing.fullText;
        const nextTextParts =
          textProvided && providedText !== null
            ? [providedText]
            : existing.textParts;

        const nextResults = {
          ...prev.results,
          [resultId]: {
            ...existing,
            success: payload.result.success,
            error: payload.result.error ?? null,
            loading: false,
            fullText: finalText ?? null,
            textParts: nextTextParts,
            metadata,
          },
        };

        return { ...prev, results: nextResults };
      });
    },
    [promptId, updateStreamingState],
  );

  const handleRunError = useCallback(
    (payload: StreamingRunError) => {
      if (payload.promptId !== promptId) return;

      if (payload.resultId) {
        const resultId = payload.resultId;
        updateStreamingState((prev) => {
          if (prev.runId && payload.runId && prev.runId !== payload.runId)
            return prev;

          const target = prev.results[resultId];
          if (!target) return prev;

          const nextResults = {
            ...prev.results,
            [resultId]: {
              ...target,
              error: payload.error,
              loading: false,
              success: false,
            },
          };

          return { ...prev, results: nextResults };
        });
      } else {
        activeRunIdRef.current = null;
        setIsStopping(false);
        updateStreamingState(
          (prev) => {
            const nextResults: Record<string, AssessmentStreamingResult> = {};
            for (const [id, value] of Object.entries(prev.results))
              nextResults[id] = { ...value, loading: false };
            return {
              ...prev,
              runId: null,
              results: nextResults,
              error: payload.error,
              completedAt: payload.timestamp,
            };
          },
          {
            isLoading: false,
            error: payload.error,
            timestamp: payload.timestamp,
          },
        );
      }
      setIsStopping(false);
    },
    [promptId, updateStreamingState],
  );

  const handleExecutionResult = useCallback(
    (payload: VscMessagePromptRun.ExecutionResult["payload"]) => {
      if (payload.promptId !== promptId) return;

      const timestamp = payload.timestamp || Date.now();
      const resultsArray = (
        Array.isArray(payload.results) ? payload.results : []
      ) as RunResult[];

      const currentRunId = activeRunIdRef.current;

      if (payload.runId && currentRunId) {
        if (payload.runId !== currentRunId) return;
        activeRunIdRef.current = null;
        updateStreamingState(
          (prev) => {
            const nextResults = { ...prev.results };
            for (const result of resultsArray) {
              const resultId = result.resultId;
              if (!resultId) continue;
              const existing = nextResults[resultId];
              if (!existing) continue;
              const finalText =
                typeof result.text === "string"
                  ? result.text
                  : (existing.fullText ?? null);
              const existingMetadata = existing.metadata ?? {};
              const mergedMetadata = {
                ...existingMetadata,
                usage: result.usage ?? existingMetadata.usage,
                totalUsage: result.totalUsage ?? existingMetadata.totalUsage,
                steps: result.steps ?? existingMetadata.steps,
                finishReason:
                  result.finishReason ?? existingMetadata.finishReason,
                warnings: result.warnings ?? existingMetadata.warnings,
                request: result.request ?? existingMetadata.request,
                response: result.response ?? existingMetadata.response,
              };

              nextResults[resultId] = {
                ...existing,
                fullText: finalText ?? null,
                textParts: finalText ? [finalText] : existing.textParts,
                success: result.success,
                error: result.error ?? existing.error,
                loading: false,
                metadata: mergedMetadata,
              };
            }

            return {
              ...prev,
              results: nextResults,
              completedAt: timestamp,
              error: payload.error ?? prev.error ?? null,
            };
          },
          {
            isLoading: false,
            error: payload.error ?? null,
            timestamp,
          },
        );
      } else {
        setExecutionState({
          isLoading: false,
          results: resultsArray,
          error: payload.error || null,
          timestamp,
          runId: payload.runId ?? null,
          promptId: payload.promptId ?? null,
          startedAt: null,
          completedAt: timestamp,
        });
      }

      resetPerRunUiState();
      setIsStopping(false);
    },
    [
      promptId,
      resetPerRunUiState,
      setExecutionState,
      setIsStopping,
      updateStreamingState,
    ],
  );

  useOn(
    "prompt-run-start",
    (message) => {
      handleRunStarted(message.payload);
    },
    [handleRunStarted],
  );

  useOn(
    "prompt-run-update",
    (message) => {
      handleRunUpdate(message.payload);
    },
    [handleRunUpdate],
  );

  useOn(
    "prompt-run-complete",
    (message) => {
      handleRunCompleted(message.payload);
    },
    [handleRunCompleted],
  );

  useOn(
    "prompt-run-error",
    (message) => {
      handleRunError(message.payload);
    },
    [handleRunError],
  );

  useOn(
    "prompt-run-result-complete",
    (message) => {
      handleRunResultCompleted(message.payload);
    },
    [handleRunResultCompleted],
  );

  useOn(
    "prompt-run-execution-result",
    (message) => {
      handleExecutionResult(message.payload);
    },
    [handleExecutionResult],
  );

  useOn(
    "settings-streaming-state",
    (message) => {
      const enabledRaw = message.payload.enabled;
      setStreamingEnabled(typeof enabledRaw === "boolean" ? enabledRaw : true);
    },
    [setStreamingEnabled],
  );

  const handleStop = useCallback(() => {
    const runId =
      activeRunIdRef.current ??
      streamingState.runId ??
      executionState.runId ??
      null;
    if (!runId || isStopping) return;
    setIsStopping(true);
    send({ type: "prompt-run-stop", payload: { runId } });
  }, [executionState.runId, isStopping, send, streamingState.runId]);

  const promptSource = useMemo(
    () => (prompt ? extractPromptText(fileContent, prompt) : ""),
    [prompt, fileContent],
  );

  const promptMeta = useMemo<PromptMeta | null>(() => {
    if (!prompt) return null;
    return {
      file: prompt.file,
      index: promptIndex,
      span: {
        start: prompt.span.outer.start,
        end: prompt.span.outer.end,
      },
      vars: (prompt.vars || []).map((variable) => variable.exp),
      source: promptSource,
    };
  }, [prompt, promptIndex, promptSource]);

  const providerOptions = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    for (const model of models) {
      const providerId = normaliseProviderId(providerFromEntry(model));
      if (!providerId) continue;
      if (!map.has(providerId)) {
        const providerMeta = modelsDevProviders[providerId];
        map.set(providerId, {
          id: providerId,
          label:
            typeof providerMeta?.name === "string"
              ? providerMeta.name
              : providerLabel(providerId),
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const scoreA = PROVIDER_POPULARITY[a.id] ?? 0;
      const scoreB = PROVIDER_POPULARITY[b.id] ?? 0;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return a.label.localeCompare(b.label);
    });
  }, [models, modelsDevProviders]);

  const groupedModelsByProvider = useMemo(() => {
    const grouped: Record<string, ProviderModelWithScore[]> = {};

    for (const model of models) {
      const providerId = normaliseProviderId(providerFromEntry(model));
      if (!providerId) continue;
      if (!grouped[providerId]) grouped[providerId] = [];
      const meta = getModelsDevMeta(providerId, model.id) as
        | { last_updated?: string; name?: string }
        | undefined;
      const displayName = model.name ?? meta?.name ?? null;
      grouped[providerId]!.push({
        id: model.id,
        ...(displayName ? { name: displayName } : {}),
        lastUpdatedMs: parseLastUpdatedMs(meta?.last_updated),
        recommendationScore: 0,
      });
    }

    const result: Record<string, Array<{ id: string; name?: string }>> = {};

    Object.entries(grouped).forEach(([providerId, list]) => {
      const orderingEntries = list.map(({ id, name, lastUpdatedMs }) =>
        name ? { id, name, lastUpdatedMs } : { id, lastUpdatedMs },
      );
      const recommendationWeights = computeRecommendationWeightsForProvider(
        providerId,
        orderingEntries,
        { modelsDevFallback },
      );

      const offlineWeights = OFFLINE_MODEL_RECOMMENDATIONS[providerId] ?? {};

      list.forEach((entry) => {
        const key = modelKeyFromId(entry.id);
        const fallbackScore = offlineWeights[key] ?? 0;
        entry.recommendationScore = recommendationWeights[key] ?? fallbackScore;
      });

      list.sort(compareProviderModelEntries);

      result[providerId] = list.map(({ id, name }) =>
        name ? { id, name } : { id },
      );
    });

    return result;
  }, [models, getModelsDevMeta, modelsDevFallback]);

  const getModelsForProvider = useCallback(
    (providerId: string | null) => {
      const providerKey = normaliseProviderId(providerId);
      const list = groupedModelsByProvider[providerKey] ?? [];
      return list.map((entry) => ({
        id: entry.id,
        label: entry.name || entry.id,
      }));
    },
    [groupedModelsByProvider],
  );

  const activeModelKey = expandedModelKey ?? modelConfigs[0]?.key ?? null;
  const activeModelConfig = useMemo(() => {
    if (!activeModelKey) return null;
    return modelConfigs.find((config) => config.key === activeModelKey) ?? null;
  }, [modelConfigs, activeModelKey]);

  const getModelEntry = useCallback(
    (config: ModelConfigState | null | undefined) => {
      if (!config?.modelId) return undefined;
      return models.find((model) => model.id === config.modelId);
    },
    [models],
  );

  const getModelCapabilities = useCallback(
    (config: ModelConfigState | null | undefined) => {
      const entry = getModelEntry(config);
      if (!entry)
        return {
          supportsImages: false,
          supportsVideo: false,
          supportsFiles: false,
          supportsTools: false,
          supportsReasoning: false,
          provider: normaliseProviderId(config?.providerId) || "",
        };
      return capsForEntry(entry as any);
    },
    [getModelEntry],
  );

  const createModelConfig = useCallback(
    (preferredModelId?: string | null): ModelConfigState => {
      const entry = preferredModelId
        ? models.find((model) => model.id === preferredModelId) || null
        : models[0] || null;
      const providerId = entry
        ? normaliseProviderId(providerFromEntry(entry))
        : (providerOptions[0]?.id ?? null);
      // @ts-expect-error -- TODO
      return {
        key: createModelConfigKey(),
        providerId,
        modelId: entry?.id ?? preferredModelId ?? null,
        label: entry?.name ?? entry?.id,
        generationOptions: {},
        reasoning: {
          enabled: false,
          effort: "medium",
          budgetTokens: "",
        },
        toolsJson: "null",
        providerOptionsJson: "{}",
        attachments: [],
      };
    },
    [models, providerOptions],
  );

  const updateModelConfig = useCallback(
    (key: string, updater: (config: ModelConfigState) => ModelConfigState) => {
      setModelConfigs((prev) =>
        prev.map((config) => (config.key === key ? updater(config) : config)),
      );
    },
    [],
  );

  const updateModelErrors = useCallback(
    (key: string, updates: ModelConfigErrors) => {
      setModelErrors((prev) => ({
        ...prev,
        [key]: { ...prev[key], ...updates },
      }));
    },
    [],
  );

  const handleDatasetLoad = useCallback(
    async (
      payload: Extract<
        VscMessageDataset,
        { type: "dataset-csv-load" }
      >["payload"],
    ) => {
      if (payload.status === "error") {
        console.error("CSV load error", payload.error);
        return;
      }

      try {
        const rows = await parseCsvString(payload.content);
        if (!rows || rows.length === 0) {
          setCsvHeader(null);
          setCsvRows([]);
          setCsvPath(payload.path || null);
          setSelectedRowIdx(null);
          return;
        }

        const [header, ...data] = rows;
        setCsvHeader(header ?? null);
        setCsvRows(data);
        setCsvPath(payload.path || null);
        setSelectedRowIdx(null);
      } catch (error) {
        console.error(
          "Failed to parse CSV",
          JSON.stringify({ error: String(error) }),
        );
      }
    },
    [],
  );

  const handleAttachmentsLoad = useCallback(
    (
      payload: Extract<
        VscMessageAttachments,
        { type: "attachments-load" }
      >["payload"],
    ) => {
      if (payload.status === "error") {
        console.error("Attachments load error", payload.error);
        return;
      }

      const items = Array.isArray(payload.items) ? payload.items : [];
      const attachments: AttachmentInput[] = items.map((item) => ({
        path: item.path,
        name: item.name,
        mime: item.mime,
        dataBase64: item.dataBase64,
      }));

      const targetKey =
        attachmentTargetKeyRef.current ||
        activeModelKey ||
        modelConfigs[0]?.key;
      if (!targetKey) return;

      updateModelConfig(targetKey, (config) => ({
        ...config,
        attachments,
      }));
      attachmentTargetKeyRef.current = null;
    },
    [activeModelKey, modelConfigs, updateModelConfig],
  );

  useOn(
    "dataset-csv-load",
    (message) => {
      void handleDatasetLoad(message.payload);
    },
    [handleDatasetLoad],
  );

  useOn(
    "attachments-load",
    (message) => {
      handleAttachmentsLoad(message.payload);
    },
    [handleAttachmentsLoad],
  );

  const requestAttachments = useCallback(
    (config: ModelConfigState | null) => {
      if (!config) return;
      const caps = getModelCapabilities(config);
      attachmentTargetKeyRef.current = config.key;
      send({
        type: "attachments-request",
        payload: { imagesOnly: caps.supportsImages && !caps.supportsFiles },
      });
    },
    [getModelCapabilities, send],
  );

  const clearAttachments = useCallback(
    (configKey: string) => {
      updateModelConfig(configKey, (config) => ({
        ...config,
        attachments: [],
      }));
    },
    [updateModelConfig],
  );

  const handleAddModel = useCallback(() => {
    const created = createModelConfig();
    setModelConfigs((prev) => [...prev, created]);
    setExpandedModelKey(created.key);
  }, [createModelConfig]);

  const handleRemoveModel = useCallback(
    (key: string) => {
      setModelConfigs((prev) => {
        if (prev.length <= 1) return prev;
        const next = prev.filter((config) => config.key !== key);
        if (expandedModelKey === key) setExpandedModelKey(next[0]?.key ?? null);
        return next;
      });
      setModelErrors((prev) => {
        const { [key]: _omit, ...rest } = prev;
        return rest;
      });
    },
    [expandedModelKey],
  );

  const handleProviderChange = useCallback(
    (config: ModelConfigState, providerId: string) => {
      const normalised = normaliseProviderId(providerId);
      const modelsForProvider = getModelsForProvider(normalised);
      const nextModelId = modelsForProvider[0]?.id ?? null;
      const entry = nextModelId
        ? models.find((model) => model.id === nextModelId) || null
        : null;
      // @ts-expect-error -- TODO
      updateModelConfig(config.key, (current) => ({
        ...current,
        providerId: normalised,
        modelId: nextModelId,
        label: entry?.name ?? entry?.id ?? current.label,
      }));
      updateModelErrors(config.key, { provider: null, model: null });
    },
    [getModelsForProvider, models, updateModelConfig, updateModelErrors],
  );

  const handleModelChange = useCallback(
    (config: ModelConfigState, modelId: string | null) => {
      const entry = modelId
        ? models.find((model) => model.id === modelId) || null
        : null;
      // @ts-expect-error -- TODO
      updateModelConfig(config.key, (current) => ({
        ...current,
        modelId,
        providerId: entry
          ? normaliseProviderId(providerFromEntry(entry))
          : current.providerId,
        label: entry?.name ?? entry?.id ?? current.label,
      }));
      updateModelErrors(config.key, { model: null });
    },
    [models, updateModelConfig, updateModelErrors],
  );

  const updateGenerationOption = useCallback(
    (
      configKey: string,
      field:
        | "maxOutputTokens"
        | "temperature"
        | "topP"
        | "topK"
        | "presencePenalty"
        | "frequencyPenalty"
        | "stopSequences"
        | "seed",
      value: number | string | undefined,
    ) => {
      updateModelConfig(configKey, (config) => {
        const next = { ...config.generationOptions } as Record<string, any>;
        if (value === undefined || value === "") delete next[field];
        else next[field] = value;
        return {
          ...config,
          generationOptions: next as GenerationOptionsInput,
        };
      });
    },
    [updateModelConfig],
  );

  const updateReasoning = useCallback(
    (configKey: string, updates: Partial<ModelConfigState["reasoning"]>) => {
      updateModelConfig(configKey, (config) => ({
        ...config,
        reasoning: { ...config.reasoning, ...updates },
      }));
    },
    [updateModelConfig],
  );

  const updateToolsJson = useCallback(
    (configKey: string, value: string) => {
      updateModelConfig(configKey, (config) => ({
        ...config,
        toolsJson: value,
      }));
      updateModelErrors(configKey, { tools: null });
    },
    [updateModelConfig, updateModelErrors],
  );

  const updateProviderOptionsJson = useCallback(
    (configKey: string, value: string) => {
      updateModelConfig(configKey, (config) => ({
        ...config,
        providerOptionsJson: value,
      }));
      updateModelErrors(configKey, { providerOptions: null });
    },
    [updateModelConfig, updateModelErrors],
  );

  useEffect(() => {
    if (!promptId || !promptMeta) return;
    const stored = loadPromptState(promptMeta);
    persistedStateRef.current = stored;

    if (stored?.data) {
      const data = stored.data;
      const nextConfigs = data.modelConfigs ?? [];
      setModelConfigs(nextConfigs);
      setExpandedModelKey((current) =>
        current && nextConfigs.some((cfg) => cfg.key === current)
          ? current
          : null,
      );
      setModelErrors({});
      setVariables(data.variables ?? {});
      if (data.csv) {
        setCsvPath(data.csv.path || null);
        setCsvHeader(data.csv.header || null);
        setCsvRows(data.csv.rows || []);
        setSelectedRowIdx(
          typeof data.csv.selectedRowIdx === "number"
            ? data.csv.selectedRowIdx
            : null,
        );
      } else {
        setCsvPath(null);
        setCsvHeader(null);
        setCsvRows([]);
        setSelectedRowIdx(null);
      }
      setInputSource(data.inputSource ?? "manual");
      setDatasetMode(data.datasetMode ?? "row");
      setRangeStart(data.range?.start ?? "");
      setRangeEnd(data.range?.end ?? "");
      if (data.execution)
        // @ts-expect-error -- TODO
        setExecutionState({
          isLoading: false,
          results: Array.isArray(data.execution.results)
            ? // @ts-expect-error -- TODO
              (data.execution.results as RunResult[])
            : [],
          error: data.execution.error ?? null,
          timestamp: data.execution.timestamp,
        });
      else setExecutionState({ isLoading: false, results: [], error: null });
      setResultsLayout(data.layout ?? "vertical");
      setActiveResultIndex(data.activeResultIndex ?? 0);
    } else {
      const nextVariables: Record<string, string> = {};
      prompt?.vars?.forEach((variable) => {
        nextVariables[variable.exp] = "";
      });
      setModelConfigs([]);
      setExpandedModelKey(null);
      setModelErrors({});
      setVariables(nextVariables);
      setCsvPath(null);
      setCsvHeader(null);
      setCsvRows([]);
      setSelectedRowIdx(null);
      setExecutionState({ isLoading: false, results: [], error: null });
      setInputSource("manual");
      setDatasetMode("row");
      setRangeStart("");
      setRangeEnd("");
      setResultsLayout("vertical");
      setActiveResultIndex(0);
    }

    setCollapsedResults({});
    setCollapsedModelSettings({});
    setViewTab({});
    setExpandedRequest({});
    setExpandedResponse({});
    setIsHydrated(true);
  }, [promptId, promptMeta, prompt]);

  useEffect(() => {
    if (!promptMeta || !isHydrated) return;

    const snapshot: PlaygroundState = {
      // @ts-expect-error -- TODO
      modelConfigs,
      variables,
      csv:
        csvHeader || csvRows.length || csvPath
          ? {
              path: csvPath,
              header: csvHeader,
              rows: csvRows,
              selectedRowIdx,
            }
          : undefined,
      inputSource,
      datasetMode,
      range: { start: rangeStart, end: rangeEnd },
      // @ts-expect-error -- TODO
      execution:
        executionState.results.length || executionState.error
          ? {
              results: executionState.results,
              error: executionState.error,
              timestamp: executionState.timestamp,
            }
          : undefined,
      layout: resultsLayout,
      activeResultIndex,
    };

    persistedStateRef.current = savePromptState(promptMeta, snapshot);
  }, [
    promptMeta,
    isHydrated,
    modelConfigs,
    variables,
    csvPath,
    csvHeader,
    csvRows,
    selectedRowIdx,
    inputSource,
    datasetMode,
    rangeStart,
    rangeEnd,
    executionState,
    resultsLayout,
    activeResultIndex,
  ]);

  useEffect(() => {
    if (!isHydrated) return;
    if (modelsLoading) return;
    if (modelConfigs.length > 0) return;
    if (models.length === 0) return;
    const initial = createModelConfig(models[0]?.id ?? null);
    setModelConfigs([initial]);
  }, [
    isHydrated,
    modelsLoading,
    modelConfigs.length,
    models,
    createModelConfig,
  ]);

  useEffect(() => {
    if (!isHydrated) return;
    if (models.length === 0) return;
    setModelConfigs((prev) =>
      prev.map((config) => {
        if (!config.modelId) return config;
        const entry = models.find((model) => model.id === config.modelId);
        if (!entry) return config;
        const providerId = normaliseProviderId(providerFromEntry(entry));
        return {
          ...config,
          providerId,
          label: entry.name ?? entry.id,
        };
      }),
    );
  }, [isHydrated, models]);

  const usingCsv = useMemo(
    () => !!csvHeader && csvRows.length > 0,
    [csvHeader, csvRows],
  );

  const headersToUse = useMemo(() => {
    if (!usingCsv) return null;
    return csvHeader!;
  }, [usingCsv, csvHeader]);

  const csvFileLabel = useMemo(() => {
    if (!csvPath) return null;
    const base = csvPath.split(/[/\\]/).pop() || csvPath;
    return base;
  }, [csvPath]);

  const computeVariablesFromRowCb = useCallback(
    (row: string[]) => computeVariablesFromRow(row, headersToUse, prompt?.vars),
    [prompt, headersToUse],
  );

  const handleSelectRow = (idxStr: string) => {
    const idx = Number(idxStr);
    if (Number.isNaN(idx) || idx < 0 || idx >= csvRows.length) return;
    setSelectedRowIdx(idx);
    const row = csvRows[idx];
    const mapped = computeVariablesFromRowCb(row!);
    setVariables(mapped);
  };

  const handleVariableChange = (varName: string, value: string) => {
    setVariables((prev) => ({ ...prev, [varName]: value }));
  };

  const handleLoadCsv = () => {
    send({ type: "dataset-csv-request" });
  };

  const handleClearCsv = () => {
    setCsvPath(null);
    setCsvHeader(null);
    setCsvRows([]);
    setSelectedRowIdx(null);
    setInputSource("manual");
    setDatasetMode("row");
    setRangeStart("");
    setRangeEnd("");
    const nextVariables: Record<string, string> = {};
    prompt?.vars?.forEach((variable) => {
      nextVariables[variable.exp] = "";
    });
    setVariables(nextVariables);
  };

  const interpolate = useCallback(
    (baseText: string, vars: Record<string, string>) =>
      substituteVariables(baseText, prompt!, vars),
    [prompt],
  );

  const canExecute = () => {
    if (!prompt?.vars) return true;
    if (inputSource === "manual")
      return prompt.vars.every((variable) => variables[variable.exp]?.trim());
    if (!usingCsv) return false;
    if (datasetMode === "row") return selectedRowIdx !== null;
    if (datasetMode === "all") return csvRows.length > 0;
    const start = Number(rangeStart);
    const end = Number(rangeEnd);
    if (
      Number.isNaN(start) ||
      Number.isNaN(end) ||
      start < 1 ||
      end < 1 ||
      start > end ||
      start > csvRows.length ||
      end > csvRows.length
    )
      return false;
    return true;
  };

  const handleExecute = () => {
    if (!prompt || !canExecute()) return;
    if (!promptId) return;

    const promptText = extractPromptText(fileContent, prompt);
    const { runs, runSettings } = buildRunsAndSettings({
      inputSource,
      datasetMode,
      csvRows,
      selectedRowIdx,
      rangeStart,
      rangeEnd,
      promptText,
      variables,
      prompt,
      headers: headersToUse,
    });

    const validationErrors: Record<string, ModelConfigErrors> = {};
    const preparedModels: Array<
      ModelConfigState & {
        caps: ReturnType<typeof getModelCapabilities>;
        parsedTools: any;
        providerOptions: any;
        reasoning: ModelConfigState["reasoning"];
        filteredAttachments: AttachmentInput[];
      }
    > = [];

    for (const config of modelConfigs) {
      const errors: ModelConfigErrors = {};
      if (!config.providerId) errors.provider = "Select provider";
      if (!config.modelId) errors.model = "Select model";

      let parsedTools: any = null;
      if (config.toolsJson.trim())
        try {
          parsedTools = JSON.parse(config.toolsJson);
        } catch (error) {
          errors.tools = "Invalid JSON in tools";
        }

      let parsedProviderOptions: any = null;
      if (config.providerOptionsJson.trim())
        try {
          parsedProviderOptions = JSON.parse(config.providerOptionsJson);
        } catch (error) {
          errors.providerOptions = "Invalid JSON in provider options";
        }

      const caps = getModelCapabilities(config);
      const sanitizedReasoning =
        caps.supportsReasoning && config.reasoning.enabled
          ? { ...config.reasoning, enabled: true }
          : { ...config.reasoning, enabled: false };
      const mergedProviderOptions = mergeProviderOptionsWithReasoning(
        parsedProviderOptions ?? null,
        caps,
        sanitizedReasoning,
      );
      const filteredAttachments = filterAttachmentsForCapabilities(
        config.attachments,
        caps,
      );

      if (
        errors.provider ||
        errors.model ||
        errors.tools ||
        errors.providerOptions
      ) {
        validationErrors[config.key] = {
          ...validationErrors[config.key],
          ...errors,
        };
        continue;
      }

      preparedModels.push({
        ...config,
        caps,
        parsedTools,
        providerOptions: mergedProviderOptions,
        reasoning: sanitizedReasoning,
        // @ts-expect-error -- TODO
        filteredAttachments,
      });
    }

    if (
      Object.keys(validationErrors).length > 0 ||
      preparedModels.length === 0
    ) {
      setModelErrors((prev) => ({ ...prev, ...validationErrors }));
      if (preparedModels.length === 0)
        setExecutionState({
          isLoading: false,
          results: [],
          error: "Configure at least one valid model before running",
        });
      return;
    }

    setModelErrors((prev) => {
      const next = { ...prev } as Record<string, ModelConfigErrors>;
      for (const model of preparedModels)
        next[model.key] = {
          provider: null,
          model: null,
          tools: null,
          providerOptions: null,
        };
      return next;
    });

    setExecutionState({ isLoading: true, results: [], error: null });
    setIsStopping(false);
    setCollapsedResults({});
    setCollapsedModelSettings({});
    setExpandedRequest({});
    setExpandedResponse({});

    const payload = {
      promptId,
      promptText,
      variables,
      runs,
      runSettings: {
        ...runSettings,
        streaming: { enabled: streamingEnabled },
      },
      streamingEnabled,
      models: preparedModels.map((model) => ({
        key: model.key,
        modelId: model.modelId,
        providerId: model.providerId,
        label: model.label ?? model.modelId,
        options: model.generationOptions as unknown as Record<string, unknown>,
        tools: model.caps.supportsTools ? (model.parsedTools ?? null) : null,
        providerOptions: model.providerOptions ?? null,
        reasoning: model.reasoning,
        attachments: model.filteredAttachments.map(
          ({ name, mime, dataBase64 }) => ({
            name: name ?? "",
            mime: mime ?? "application/octet-stream",
            dataBase64: dataBase64 ?? "",
          }),
        ),
      })),
    };

    send({ type: "prompt-run-execute", payload });
  };

  const handleExecuteRef = useRef<() => void>(() => {});
  handleExecuteRef.current = handleExecute;

  useOn(
    "prompts-execute-from-command",
    () => {
      handleExecuteRef.current();
    },
    [],
  );

  const handleClear = () => {
    setExecutionState({
      isLoading: false,
      results: [],
      error: null,
    });
    setStreamingState(createEmptyStreamingState());
    setIsStopping(false);
    activeRunIdRef.current = null;
    setCollapsedResults({});
    setCollapsedModelSettings({});
    setExpandedRequest({});
    setExpandedResponse({});
    setViewTab({});
  };

  useEffect(() => {
    setActiveResultIndex((idx) => {
      if (executionState.results.length === 0) return 0;
      return Math.min(idx, executionState.results.length - 1);
    });
  }, [executionState.results.length]);

  if (!prompt) return null;

  const hasVariables = prompt.vars && prompt.vars.length > 0;
  const activeRunId = streamingState.runId;
  const runInFlight =
    Boolean(activeRunId) || executionState.isLoading || isStopping;
  const showStopButton = runInFlight;
  const stopDisabled = isStopping || !activeRunId;
  const canRunPrompt = canExecute();

  const renderResultCard = (result: RunResult, index: number) => {
    if (!result) return null;
    const isVerticalLayout = resultsLayout === "vertical";
    const collapsed = isVerticalLayout ? !!collapsedResults[index] : false;
    const modelEntry = result.model?.id
      ? models.find((model) => model.id === result.model?.id) || null
      : null;

    const isLoading = Boolean(result.isLoading);
    const showFailureBadge = !isLoading && result.success === false;

    const headerTitle =
      result.label ||
      [result.model?.label ?? result.model?.id, result.runLabel]
        .filter(Boolean)
        .join(" • ") ||
      `Result ${index + 1}`;

    const modelSettingsPayload = result.model?.settings
      ? {
          id: result.model.id,
          provider: result.model.providerId,
          options: result.model.settings.options,
          reasoning: result.model.settings.reasoning,
          providerOptions: result.model.settings.providerOptions,
          tools: result.model.settings.tools,
          attachments: result.model.settings.attachments,
        }
      : null;

    const modelSettingsCollapsed = collapsedModelSettings[index] ?? true;

    const hasPromptContent = typeof result.prompt === "string";
    const showContentSection = true;

    return (
      <div className="border rounded">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="flex items-center gap-2">
            {isVerticalLayout && (
              <button
                className="px-2 py-1 border rounded text-xs"
                onClick={() =>
                  setCollapsedResults((prev) => ({
                    ...prev,
                    [index]: !collapsed,
                  }))
                }
                title={collapsed ? "Expand" : "Collapse"}
              >
                {collapsed ? "+" : "–"}
              </button>
            )}
            <span className="text-sm font-medium">{headerTitle}</span>
            {showFailureBadge && <span className="text-xs">Failed</span>}
          </div>
          {executionState.timestamp && (
            <span className="text-xs">
              {new Date(executionState.timestamp).toLocaleString()}
            </span>
          )}
        </div>
        {!collapsed && (
          <div className="p-3 space-y-3">
            {isLoading && !result.error && (
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span
                  aria-hidden
                  className="inline-flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"
                />
                <span>
                  {result.streaming === false
                    ? "Waiting for result…"
                    : "Streaming…"}
                </span>
              </div>
            )}

            {result.nonStreamingNote && (
              <div className="text-xs text-neutral-500">
                {result.nonStreamingNote}
              </div>
            )}

            {result.error && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Error</h5>
                <div className="p-3 rounded border">
                  <pre className="text-sm whitespace-pre-wrap">
                    {result.error}
                  </pre>
                </div>
              </div>
            )}

            {modelSettingsPayload && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-medium">Model Settings</h5>
                  <button
                    className="text-xs hover:underline"
                    onClick={() =>
                      setCollapsedModelSettings((prev) => ({
                        ...prev,
                        [index]: !(prev[index] ?? true),
                      }))
                    }
                  >
                    {modelSettingsCollapsed ? "Show settings" : "Hide settings"}
                  </button>
                </div>
                {!modelSettingsCollapsed && (
                  <div className="p-3 rounded border overflow-auto">
                    <JsonView
                      value={modelSettingsPayload as object}
                      displayObjectSize={false}
                      shouldExpandNodeInitially={shouldExpandNodeInitially}
                    />
                  </div>
                )}
              </div>
            )}

            {result.request && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-medium">Request</h5>
                  <button
                    className="text-xs hover:underline"
                    onClick={() =>
                      setExpandedRequest((prev) => ({
                        ...prev,
                        [index]: !prev[index],
                      }))
                    }
                  >
                    {expandedRequest[index] ? "Hide request" : "Show request"}
                  </button>
                </div>
                {expandedRequest[index] && (
                  <div className="p-3 rounded border overflow-auto">
                    <JsonView
                      value={result.request as object}
                      displayObjectSize={false}
                      shouldExpandNodeInitially={shouldExpandNodeInitially}
                    />
                  </div>
                )}
              </div>
            )}

            {showContentSection && (
              <div className="space-y-2">
                {hasPromptContent && (
                  <div className="space-y-1">
                    <h5 className="text-sm font-medium">User Message</h5>
                    <div className="p-3 rounded border">
                      <pre className="text-xs whitespace-pre-wrap overflow-x-auto">
                        {result.prompt}
                      </pre>
                    </div>
                  </div>
                )}
                {(() => {
                  const rawText = result.text ?? "";
                  const textParts = result.textParts ?? [];
                  const trimmedText = rawText.trim();

                  let parsedTextJson: any = null;
                  if (trimmedText)
                    try {
                      const parsed = JSON.parse(trimmedText);
                      if (parsed && typeof parsed === "object")
                        parsedTextJson = parsed;
                    } catch (error) {}

                  const isJson = parsedTextJson !== null;
                  const assembledText =
                    rawText.length > 0 ? rawText : textParts.join("");
                  const hasContent = assembledText.length > 0;
                  const currentView = viewTab[index] ?? "rendered";
                  const renderedLabel = isJson ? "JSON" : "Rendered";

                  const placeholderCopy = isLoading
                    ? "Waiting for output…"
                    : "No output yet.";

                  const handleSetView = (tab: "rendered" | "raw") => {
                    setViewTab((prev) => ({
                      ...prev,
                      [index]: tab,
                    }));
                  };

                  const renderedContent = isJson ? (
                    <div className="overflow-auto">
                      <JsonView
                        value={parsedTextJson as object}
                        displayObjectSize={false}
                        shouldExpandNodeInitially={shouldExpandNodeInitially}
                      />
                    </div>
                  ) : (
                    <StreamingMarkdown
                      text={rawText}
                      textParts={textParts}
                      runId={result.runId || null}
                      resultId={result.resultId || null}
                      streaming={
                        Boolean(result.streaming) || isLoading || !hasContent
                      }
                      wrapperClassName="streamdown-content prose prose-sm max-w-none"
                      emptyPlaceholder={
                        <div className="text-xs text-neutral-500">
                          {placeholderCopy}
                        </div>
                      }
                      allowedLinkPrefixes={["https://", "http://", "mailto:"]}
                      allowedImagePrefixes={["https://", "http://"]}
                    />
                  );

                  const rawContent = hasContent ? (
                    <pre className="text-xs whitespace-pre-wrap overflow-x-auto">
                      {assembledText}
                    </pre>
                  ) : (
                    <div className="text-xs text-neutral-500">
                      {placeholderCopy}
                    </div>
                  );

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          className={`px-2 py-1 border rounded ${currentView === "rendered" ? "font-semibold" : ""}`}
                          onClick={() => handleSetView("rendered")}
                        >
                          {renderedLabel}
                        </button>
                        <button
                          type="button"
                          className={`px-2 py-1 border rounded ${currentView === "raw" ? "font-semibold" : ""}`}
                          onClick={() => handleSetView("raw")}
                        >
                          Raw
                        </button>
                      </div>
                      <div className="p-3 rounded border">
                        {currentView === "rendered"
                          ? renderedContent
                          : rawContent}
                      </div>
                    </div>
                  );
                })()}

                {result.response && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h6 className="text-xs font-medium">Response JSON</h6>
                      <button
                        className="text-xs hover:underline"
                        onClick={() =>
                          setExpandedResponse((prev) => ({
                            ...prev,
                            [index]: !prev[index],
                          }))
                        }
                      >
                        {expandedResponse[index]
                          ? "Hide response"
                          : "Show response"}
                      </button>
                    </div>
                    {expandedResponse[index] && (
                      <div className="p-3 rounded border overflow-auto">
                        <JsonView
                          value={result.response as object}
                          displayObjectSize={false}
                          shouldExpandNodeInitially={shouldExpandNodeInitially}
                        />
                      </div>
                    )}
                  </div>
                )}

                <PricingInfo usage={result.usage} modelEntry={modelEntry} />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">Model</h4>
            <ModelStatusDot status={modelStatus} />
          </div>
          <button
            type="button"
            onClick={handleAddModel}
            disabled={modelsLoading && models.length === 0}
            className="inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded disabled:opacity-60"
          >
            {modelConfigs.length > 1 ? "Add model" : "Multi model"}
          </button>
        </div>
        {modelsError && <div className="text-xs">{modelsError}</div>}
        {modelsLoading && models.length === 0 && (
          <div className="text-xs">Loading models…</div>
        )}
        {modelConfigs.length === 0 && !modelsLoading && (
          <div className="text-xs">
            No models available. Provide gateway credentials to load models.
          </div>
        )}
        <div className="space-y-3">
          {modelConfigs.map((config, index) => {
            const modelOptions = getModelsForProvider(config.providerId);
            const caps = getModelCapabilities(config);
            const errors = modelErrors[config.key] || {};
            const isExpanded = expandedModelKey === config.key;
            const attachments = config.attachments || [];
            const logoUrl = caps.provider
              ? providerLogoUrl(caps.provider, { format: "svg" })
              : "";
            return (
              <div key={config.key} className="border rounded p-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label={{ a11y: "Select model provider" }}
                    options={providerOptions.map((provider) => ({
                      label: provider.label,
                      value: provider.id,
                    }))}
                    selectedKey={config.providerId}
                    onSelectionChange={(providerId) =>
                      // @ts-expect-error -- TODO
                      handleProviderChange(config, providerId)
                    }
                    placeholder="Select provider..."
                    size="small"
                    errors={errors.provider}
                  />

                  <Select
                    label={{ a11y: "Select model" }}
                    options={modelOptions.map((model) => ({
                      label: model.label,
                      value: model.id,
                    }))}
                    selectedKey={config.modelId}
                    onSelectionChange={(modelId) =>
                      // @ts-expect-error -- TODO
                      handleModelChange(config, modelId)
                    }
                    isDisabled={modelOptions.length === 0}
                    placeholder="Select model..."
                    size="small"
                    errors={errors.model}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt={caps.provider}
                      className="h-5 w-5"
                    />
                  )}

                  <Button
                    size="xsmall"
                    style="transparent"
                    onClick={() =>
                      setExpandedModelKey(isExpanded ? null : config.key)
                    }
                  >
                    {isExpanded ? "Hide options" : "Configure"}
                  </Button>

                  {modelConfigs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveModel(config.key)}
                      className="ml-auto inline-flex items-center justify-center h-6 w-6 rounded-full border text-xs"
                      title="Remove model"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {config.modelId && (
                  <div className="flex items-center gap-2 text-[10px] flex-wrap">
                    {caps.supportsImages && (
                      <span className="px-2 py-0.5 rounded border">Images</span>
                    )}
                    {caps.supportsVideo && (
                      <span className="px-2 py-0.5 rounded border">Video</span>
                    )}
                    {caps.supportsFiles && (
                      <span className="px-2 py-0.5 rounded border">Files</span>
                    )}
                    {caps.supportsTools && (
                      <span className="px-2 py-0.5 rounded border">Tools</span>
                    )}
                    {caps.supportsReasoning && (
                      <span className="px-2 py-0.5 rounded border">
                        Reasoning
                      </span>
                    )}
                  </div>
                )}

                {isExpanded && (
                  <div className="space-y-4 border rounded p-3">
                    {(() => {
                      const canAttach =
                        caps.supportsFiles || caps.supportsImages;
                      if (!canAttach && attachments.length === 0) return null;
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {canAttach && (
                                <button
                                  type="button"
                                  onClick={() => requestAttachments(config)}
                                  className="inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded whitespace-nowrap"
                                >
                                  {caps.supportsFiles
                                    ? "Attach Files"
                                    : "Attach Images"}
                                </button>
                              )}
                              {attachments.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => clearAttachments(config.key)}
                                  className="inline-flex items-center px-2.5 py-1.5 border text-xs font-medium rounded whitespace-nowrap"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                            {attachments.length > 0 && (
                              <span className="text-xs">
                                {attachments.length} attachment
                                {attachments.length > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          {attachments.length > 0 && (
                            <div className="p-2 border rounded">
                              <ul className="text-xs space-y-1">
                                {attachments.map(
                                  (attachment, attachmentIdx) => (
                                    <li
                                      key={`${attachment.path}-${attachmentIdx}`}
                                      className="flex justify-between"
                                    >
                                      <span className="truncate">
                                        {attachment.name}
                                      </span>
                                      <span className="ml-2">
                                        {attachment.mime || ""}
                                      </span>
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <label className="text-xs">
                        Max tokens
                        <input
                          type="number"
                          className="mt-1 w-full px-2 py-1 border rounded text-xs"
                          value={config.generationOptions.maxOutputTokens ?? ""}
                          onChange={(event) =>
                            updateGenerationOption(
                              config.key,
                              "maxOutputTokens",
                              event.target.value === ""
                                ? undefined
                                : Number(event.target.value),
                            )
                          }
                          min={1}
                        />
                      </label>
                      <label className="text-xs">
                        Temperature
                        <input
                          type="number"
                          className="mt-1 w-full px-2 py-1 border rounded text-xs"
                          value={config.generationOptions.temperature ?? ""}
                          onChange={(event) =>
                            updateGenerationOption(
                              config.key,
                              "temperature",
                              event.target.value === ""
                                ? undefined
                                : Number(event.target.value),
                            )
                          }
                          step={0.01}
                          min={0}
                          max={2}
                        />
                      </label>
                      <label className="text-xs">
                        Top P
                        <input
                          type="number"
                          className="mt-1 w-full px-2 py-1 border rounded text-xs"
                          value={config.generationOptions.topP ?? ""}
                          onChange={(event) =>
                            updateGenerationOption(
                              config.key,
                              "topP",
                              event.target.value === ""
                                ? undefined
                                : Number(event.target.value),
                            )
                          }
                          step={0.01}
                          min={0}
                          max={1}
                        />
                      </label>
                      <label className="text-xs">
                        Top K
                        <input
                          type="number"
                          className="mt-1 w-full px-2 py-1 border rounded text-xs"
                          value={config.generationOptions.topK ?? ""}
                          onChange={(event) =>
                            updateGenerationOption(
                              config.key,
                              "topK",
                              event.target.value === ""
                                ? undefined
                                : Number(event.target.value),
                            )
                          }
                          min={0}
                        />
                      </label>
                      <label className="text-xs">
                        Presence penalty
                        <input
                          type="number"
                          className="mt-1 w-full px-2 py-1 border rounded text-xs"
                          value={config.generationOptions.presencePenalty ?? ""}
                          onChange={(event) =>
                            updateGenerationOption(
                              config.key,
                              "presencePenalty",
                              event.target.value === ""
                                ? undefined
                                : Number(event.target.value),
                            )
                          }
                          step={0.1}
                          min={-2}
                          max={2}
                        />
                      </label>
                      <label className="text-xs">
                        Frequency penalty
                        <input
                          type="number"
                          className="mt-1 w-full px-2 py-1 border rounded text-xs"
                          value={
                            config.generationOptions.frequencyPenalty ?? ""
                          }
                          onChange={(event) =>
                            updateGenerationOption(
                              config.key,
                              "frequencyPenalty",
                              event.target.value === ""
                                ? undefined
                                : Number(event.target.value),
                            )
                          }
                          step={0.1}
                          min={-2}
                          max={2}
                        />
                      </label>
                      <label className="text-xs">
                        Stop sequences
                        <input
                          type="text"
                          className="mt-1 w-full px-2 py-1 border rounded text-xs"
                          value={config.generationOptions.stopSequences ?? ""}
                          onChange={(event) =>
                            updateGenerationOption(
                              config.key,
                              "stopSequences",
                              event.target.value,
                            )
                          }
                          placeholder="comma,separated"
                        />
                      </label>
                      <label className="text-xs">
                        Seed
                        <input
                          type="number"
                          className="mt-1 w-full px-2 py-1 border rounded text-xs"
                          value={config.generationOptions.seed ?? ""}
                          onChange={(event) =>
                            updateGenerationOption(
                              config.key,
                              "seed",
                              event.target.value === ""
                                ? undefined
                                : Number(event.target.value),
                            )
                          }
                        />
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="inline-flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={
                            caps.supportsReasoning && config.reasoning.enabled
                          }
                          onChange={(event) =>
                            updateReasoning(config.key, {
                              enabled:
                                caps.supportsReasoning && event.target.checked,
                            })
                          }
                          disabled={!caps.supportsReasoning}
                        />
                        Enable reasoning
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="text-xs">
                          Reasoning effort
                          <select
                            className="mt-1 w-full px-2 py-1 border rounded text-xs"
                            value={config.reasoning.effort}
                            onChange={(event) =>
                              updateReasoning(config.key, {
                                effort: event.target
                                  .value as typeof config.reasoning.effort,
                              })
                            }
                            disabled={
                              !caps.supportsReasoning ||
                              !config.reasoning.enabled
                            }
                          >
                            <option value="low">low</option>
                            <option value="medium">medium</option>
                            <option value="high">high</option>
                          </select>
                        </label>
                        <label className="text-xs">
                          Budget tokens (optional)
                          <input
                            type="number"
                            className="mt-1 w-full px-2 py-1 border rounded text-xs"
                            value={config.reasoning.budgetTokens}
                            onChange={(event) =>
                              updateReasoning(config.key, {
                                budgetTokens:
                                  event.target.value === ""
                                    ? ""
                                    : Number(event.target.value),
                              })
                            }
                            disabled={
                              !caps.supportsReasoning ||
                              !config.reasoning.enabled
                            }
                            min={0}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="text-xs">
                        Tools (JSON)
                        <textarea
                          className="mt-1 w-full px-2 py-1 border rounded text-xs font-mono"
                          rows={3}
                          value={config.toolsJson}
                          onChange={(event) =>
                            updateToolsJson(config.key, event.target.value)
                          }
                          placeholder="null"
                        />
                        {errors.tools && (
                          <span className="text-xs">{errors.tools}</span>
                        )}
                      </label>
                      <label className="text-xs">
                        Provider Options (JSON)
                        <textarea
                          className="mt-1 w-full px-2 py-1 border rounded text-xs font-mono"
                          rows={3}
                          value={config.providerOptionsJson}
                          onChange={(event) =>
                            updateProviderOptionsJson(
                              config.key,
                              event.target.value,
                            )
                          }
                          placeholder="{}"
                        />
                        {errors.providerOptions && (
                          <span className="text-xs">
                            {errors.providerOptions}
                          </span>
                        )}
                      </label>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Input source and dataset controls */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium">Input Source</h5>
        <div className="flex items-center gap-4 text-sm">
          <label className="inline-flex items-center gap-1">
            <input
              type="radio"
              name="input-source"
              value="manual"
              checked={inputSource === "manual"}
              onChange={() => setInputSource("manual")}
            />
            Enter manually
          </label>
          <label className="inline-flex items-center gap-1">
            <input
              type="radio"
              name="input-source"
              value="dataset"
              checked={inputSource === "dataset"}
              onChange={() => setInputSource("dataset")}
            />
            Use dataset
          </label>
        </div>
      </div>

      {inputSource === "dataset" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadCsv}
                className="inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded whitespace-nowrap"
              >
                {usingCsv ? "Reload CSV" : "Load CSV"}
              </button>
              {usingCsv && (
                <button
                  onClick={handleClearCsv}
                  className="inline-flex items-center px-2.5 py-1.5 border text-xs font-medium rounded whitespace-nowrap"
                >
                  Clear CSV
                </button>
              )}
            </div>

            {usingCsv && (
              <div className="min-w-0 flex-1 text-right">
                <span className="text-xs font-mono truncate block">
                  {csvFileLabel ? `Loaded: ${csvFileLabel}` : "CSV loaded"}
                </span>
              </div>
            )}
          </div>

          {!usingCsv && (
            <div className="text-xs border rounded p-2">
              Load a CSV to enable dataset options.
            </div>
          )}

          {usingCsv && (
            <>
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Run Scope</h5>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="radio"
                      name="dataset-mode"
                      value="row"
                      checked={datasetMode === "row"}
                      onChange={() => setDatasetMode("row")}
                    />
                    Select row
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="radio"
                      name="dataset-mode"
                      value="range"
                      checked={datasetMode === "range"}
                      onChange={() => setDatasetMode("range")}
                    />
                    Enter CSV range
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="radio"
                      name="dataset-mode"
                      value="all"
                      checked={datasetMode === "all"}
                      onChange={() => setDatasetMode("all")}
                    />
                    All rows
                  </label>
                </div>
              </div>

              {datasetMode === "row" && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Select Row</h5>
                  <select
                    className="w-full px-3 py-2 border rounded text-sm"
                    value={selectedRowIdx ?? ""}
                    onChange={(event) => handleSelectRow(event.target.value)}
                  >
                    <option value="" disabled>
                      Choose a row
                    </option>
                    {csvRows.map((row, idx) => {
                      const label = headersToUse
                        ? headersToUse
                            .slice(0, Math.min(headersToUse.length, 5))
                            .map(
                              (header, headerIdx) =>
                                `${header}=${row[headerIdx] ?? ""}`,
                            )
                            .join(", ")
                        : row.slice(0, 5).join(", ");
                      return (
                        <option key={idx} value={idx}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-xs">
                    Selecting a row fills the variables below and overrides
                    manual input.
                  </p>
                </div>
              )}

              {datasetMode === "range" && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Enter CSV Range</h5>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={csvRows.length}
                      value={rangeStart}
                      onChange={(event) => setRangeStart(event.target.value)}
                      placeholder="Start (1)"
                      className="w-28 px-3 py-2 border rounded text-sm"
                    />
                    <span>to</span>
                    <input
                      type="number"
                      min={1}
                      max={csvRows.length}
                      value={rangeEnd}
                      onChange={(event) => setRangeEnd(event.target.value)}
                      placeholder={`End (${csvRows.length})`}
                      className="w-28 px-3 py-2 border rounded text-sm"
                    />
                  </div>
                  <p className="text-xs">
                    Range is inclusive. 1 to {csvRows.length} available.
                  </p>
                </div>
              )}

              {datasetMode === "all" && (
                <div className="text-xs">
                  All rows will run ({csvRows.length}).
                </div>
              )}
            </>
          )}
        </div>
      )}

      {hasVariables && inputSource === "manual" && (
        <div className="space-y-3">
          <h5 className="text-sm font-medium">Variables</h5>
          {prompt.vars!.map((variable: PromptVar) => (
            <div key={variable.exp} className="space-y-1">
              <label className="block text-sm font-medium">
                {variable.exp}
              </label>
              <input
                type="text"
                value={variables[variable.exp] || ""}
                onChange={(event) =>
                  handleVariableChange(variable.exp, event.target.value)
                }
                className="w-full px-3 py-2 border rounded focus:outline-none text-sm"
                placeholder={`Enter value for ${variable.exp}`}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleExecute}
            disabled={runInFlight || !canRunPrompt}
            className="px-4 py-2 border text-sm font-medium rounded disabled:opacity-60"
          >
            {isStopping
              ? "Stopping…"
              : runInFlight
                ? "Running..."
                : "Run Prompt"}
          </button>

          {showStopButton && (
            <button
              type="button"
              onClick={handleStop}
              disabled={stopDisabled}
              className="px-3 py-2 border text-sm font-medium rounded disabled:opacity-60"
            >
              {isStopping ? "Stopping…" : "Stop"}
            </button>
          )}
        </div>

        <label
          htmlFor={streamingToggleId}
          className="flex items-center gap-2 text-sm"
        >
          <input
            id={streamingToggleId}
            type="checkbox"
            className="h-4 w-4"
            checked={streamingEnabled}
            disabled={runInFlight}
            onChange={(event) => {
              const enabled = event.target.checked;
              setStreamingEnabled(enabled);
              send({
                type: "settings-streaming-set",
                payload: { enabled },
              });
            }}
          />
          Stream output
        </label>

        {(executionState.results.length > 0 || executionState.error) && (
          <button
            onClick={handleClear}
            disabled={runInFlight}
            className="px-4 py-2 border text-sm font-medium rounded disabled:opacity-60"
          >
            Clear
          </button>
        )}
      </div>

      {executionState.results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium">Results</h5>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setResultsLayout("vertical")}
                className={`px-2 py-1 text-xs font-medium rounded border ${resultsLayout === "vertical" ? "font-semibold" : ""}`}
              >
                Vertical
              </button>
              <button
                type="button"
                onClick={() => setResultsLayout("horizontal")}
                className={`px-2 py-1 text-xs font-medium rounded border ${resultsLayout === "horizontal" ? "font-semibold" : ""}`}
              >
                Horizontal
              </button>
              <button
                type="button"
                onClick={() => setResultsLayout("carousel")}
                className={`px-2 py-1 text-xs font-medium rounded border ${resultsLayout === "carousel" ? "font-semibold" : ""}`}
              >
                Carousel
              </button>
            </div>
          </div>

          {resultsLayout === "horizontal" && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {executionState.results.map((result, index) => (
                <div
                  key={index}
                  className="min-w-[360px] max-w-[480px] flex-shrink-0"
                >
                  {renderResultCard(result, index)}
                </div>
              ))}
            </div>
          )}

          {resultsLayout === "vertical" && (
            <div className="space-y-3">
              {executionState.results.map((result, index) => (
                <div key={index}>{renderResultCard(result, index)}</div>
              ))}
            </div>
          )}

          {resultsLayout === "carousel" &&
            executionState.results.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">
                    Result {activeResultIndex + 1} of{" "}
                    {executionState.results.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveResultIndex((index) => Math.max(index - 1, 0))
                      }
                      disabled={activeResultIndex === 0}
                      className="h-7 w-7 inline-flex items-center justify-center border rounded disabled:opacity-50"
                    >
                      ◀
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveResultIndex((index) =>
                          Math.min(
                            index + 1,
                            executionState.results.length - 1,
                          ),
                        )
                      }
                      disabled={
                        activeResultIndex === executionState.results.length - 1
                      }
                      className="h-7 w-7 inline-flex items-center justify-center border rounded disabled:opacity-50"
                    >
                      ▶
                    </button>
                  </div>
                </div>
                {renderResultCard(
                  executionState.results[activeResultIndex]!,
                  activeResultIndex,
                )}
              </div>
            )}
        </div>
      )}

      {executionState.error && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium">Error</h5>
          <div className="p-3 rounded border">
            <pre className="text-sm whitespace-pre-wrap">
              {executionState.error}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function PricingInfo(props: { usage: any; modelEntry: AvailableModel | null }) {
  const { usage, modelEntry } = props;
  if (!usage || !modelEntry?.pricing) return null;
  const inputPerToken = Number(modelEntry.pricing.input || 0);
  const outputPerToken = Number((modelEntry.pricing as any).output || 0);
  const inputTokens =
    usage.inputTokens ?? usage.input ?? usage.promptTokens ?? 0;
  const outputTokens =
    usage.outputTokens ?? usage.output ?? usage.completionTokens ?? 0;
  const inputCost = inputTokens * inputPerToken;
  const outputCost = outputTokens * outputPerToken;
  const total = inputCost + outputCost;
  return (
    <div className="text-xs">
      <div className="inline-flex items-center gap-2 px-2 py-1 border rounded">
        <span className="font-medium">Estimated cost:</span>
        <span>${total.toFixed(6)}</span>
        <span>
          (in: {inputTokens} • ${inputCost.toFixed(6)}, out: {outputTokens} • $
          {outputCost.toFixed(6)})
        </span>
      </div>
    </div>
  );
}
