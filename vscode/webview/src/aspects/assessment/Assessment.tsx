import { createGateway } from "@ai-sdk/gateway";
import type { Prompt, PromptVar } from "@mindcontrol/code-types";
import JsonView, { ShouldExpandNodeInitially } from "@uiw/react-json-view";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { buildRunsAndSettings, computeVariablesFromRow } from "@wrkspc/dataset";
import { Button } from "@wrkspc/ds";
import type { AttachmentInput, GenerationOptionsInput } from "@wrkspc/model";
import {
  filterAttachmentsForCapabilities,
  mergeProviderOptionsWithReasoning,
  providerFromEntry,
  providerLogoUrl,
  selectedModelCapabilities as capsForEntry,
  setModelsDevData,
} from "@wrkspc/model";
import { extractPromptText, substituteVariables } from "@wrkspc/prompt";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseString as parseCsvString } from "smolcsv";
import { useVsc } from "../vsc/Context";
import {
  loadPromptState,
  PersistedPromptState,
  savePromptState,
  PromptMeta,
  PlaygroundState,
  ResultsLayout,
} from "./persistence";

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

interface AvailableModel {
  id: string;
  name?: string;
  modelType?: string | null;
  specification?: { provider?: string };
  pricing?: Record<string, number>;
}

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
  runLabel?: string;
  label?: string;
  prompt?: string | null;
  text?: string | null;
  request?: object | null;
  response?: object | null;
  usage?: any;
  error?: string | null;
  model?: {
    key: string;
    id: string | null;
    providerId: string | null;
    label?: string | null;
    settings?: {
      options?: GenerationOptionsInput;
      reasoning?: {
        enabled: boolean;
        effort: "low" | "medium" | "high";
        budgetTokens?: number | "";
      };
      providerOptions?: any;
      tools?: any;
      attachments?: AttachmentInput[];
    };
  };
}

interface ExecutionState {
  isLoading: boolean;
  results: RunResult[];
  error: string | null;
  timestamp?: number;
}

const PROVIDER_POPULARITY: Record<string, number> = {
  openai: 100,
  anthropic: 95,
  google: 90,
  meta: 80,
  mistral: 70,
};

const MODEL_POPULARITY: Record<string, Record<string, number>> = {
  openai: {
    "gpt-4.1-mini": 100,
    "gpt-4o-mini": 95,
    "o3-mini": 90,
  },
  anthropic: {
    "claude-3.5-sonnet": 100,
    "claude-3.5-haiku": 95,
    "claude-3.5-opus": 90,
  },
  google: {
    "gemini-2.0-flash": 100,
    "gemini-1.5-pro": 95,
    "gemini-1.5-flash": 90,
  },
  meta: {
    "llama-3.1-405b": 100,
    "llama-3.1-70b": 95,
    "llama-3.1-8b": 90,
  },
  mistral: {
    "mistral-large": 100,
    "mistral-small": 95,
    "mistral-nemo": 90,
  },
};

function normaliseProviderId(value: string | null | undefined): string {
  return (value ?? "").toLowerCase();
}

function modelKeyFromId(id: string | null | undefined): string {
  if (!id) return "";
  return id.split("/").pop()?.toLowerCase() ?? id.toLowerCase();
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

function scoreModelPopularity(
  providerId: string,
  modelId: string | null | undefined,
): number {
  const providerKey = normaliseProviderId(providerId);
  const models = MODEL_POPULARITY[providerKey];
  if (!models || !modelId) return 0;
  const key = modelKeyFromId(modelId);
  return models[key] || 0;
}

export namespace Assessment {
  export interface Props {
    prompt: Prompt | undefined;
    vercelGatewayKey: string | null;
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
  const { vsc } = useVsc();
  const [modelsDevTick, setModelsDevTick] = useState(0);
  const [models, setModels] = useState<AvailableModel[]>([]);
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

  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const [executionState, setExecutionState] = useState<ExecutionState>({
    isLoading: false,
    results: [],
    error: null,
  });
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
  const [textViewTab, setTextViewTab] = useState<
    Record<number, "raw" | "markdown">
  >({});
  const [expandedRequest, setExpandedRequest] = useState<
    Record<number, boolean>
  >({});
  const [expandedResponse, setExpandedResponse] = useState<
    Record<number, boolean>
  >({});
  const [collapsedModelSettings, setCollapsedModelSettings] = useState<
    Record<number, boolean>
  >({});
  const persistedStateRef = useRef<PersistedPromptState | undefined>(undefined);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (resultsLayout !== "vertical") setCollapsedResults({});
  }, [resultsLayout]);

  const promptId = prompt
    ? `${prompt.file}:${prompt.span.outer.start}-${prompt.span.outer.end}`
    : null;

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
      if (!map.has(providerId))
        map.set(providerId, {
          id: providerId,
          label: providerLabel(providerId),
        });
    }
    return Array.from(map.values()).sort((a, b) => {
      const scoreA = PROVIDER_POPULARITY[a.id] ?? 0;
      const scoreB = PROVIDER_POPULARITY[b.id] ?? 0;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return a.label.localeCompare(b.label);
    });
  }, [models]);

  const modelsByProvider = useMemo(() => {
    const grouped: Record<string, Array<{ id: string; name?: string }>> = {};
    for (const model of models) {
      const providerId = normaliseProviderId(providerFromEntry(model));
      if (!grouped[providerId]) grouped[providerId] = [];
      grouped[providerId]!.push({ id: model.id, name: model.name });
    }
    Object.entries(grouped).forEach(([providerId, list]) => {
      list.sort((a, b) => {
        const scoreA = scoreModelPopularity(providerId, a.id);
        const scoreB = scoreModelPopularity(providerId, b.id);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return (a.name || a.id).localeCompare(b.name || b.id);
      });
    });
    return grouped;
  }, [models]);

  const getModelsForProvider = useCallback(
    (providerId: string | null) => {
      const providerKey = normaliseProviderId(providerId);
      const list = modelsByProvider[providerKey] ?? [];
      return list.map((entry) => ({
        id: entry.id,
        label: entry.name || entry.id,
      }));
    },
    [modelsByProvider],
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

  const requestAttachments = useCallback(
    (config: ModelConfigState | null) => {
      if (!config) return;
      const caps = getModelCapabilities(config);
      attachmentTargetKeyRef.current = config.key;
      vsc.postMessage({
        type: "requestAttachmentPick",
        payload: { imagesOnly: caps.supportsImages && !caps.supportsFiles },
      });
    },
    [getModelCapabilities, vsc],
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
        setExecutionState({
          isLoading: false,
          results: Array.isArray(data.execution.results)
            ? (data.execution.results as RunResult[])
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
    setTextViewTab({});
    setExpandedRequest({});
    setExpandedResponse({});
    setIsHydrated(true);
  }, [promptId, promptMeta, prompt]);

  useEffect(() => {
    if (!promptMeta || !isHydrated) return;

    const snapshot: PlaygroundState = {
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

  const fetchModels = useCallback(async () => {
    if (vercelGatewayKey === undefined) return;
    setModelsLoading(true);
    setModelsError(null);
    try {
      const res = await (vercelGatewayKey
        ? createGateway({ apiKey: vercelGatewayKey }).getAvailableModels()
        : fetch(
            `${import.meta.env.VITE_MINDRIG_GATEWAY_ORIGIN}/vercel/models`,
          ).then((r) => r.json()));
      const list = (res.models || []).filter(
        (model: any) => (model.modelType ?? "language") === "language",
      );
      setModels(list);
    } catch (error) {
      console.error(
        "Failed to load models",
        JSON.stringify({ error: String(error) }),
      );
      setModelsError(
        error instanceof Error
          ? error.message
          : "Failed to load models from Gateway",
      );
    } finally {
      setModelsLoading(false);
    }
  }, [vercelGatewayKey]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type !== "modelsDev") return;
      if (message.payload?.data) {
        setModelsDevData(message.payload.data);
        setModelsDevTick((tick) => tick + 1);
      }
    };
    window.addEventListener("message", onMessage);
    vsc.postMessage({ type: "getModelsDev" });
    return () => window.removeEventListener("message", onMessage);
  }, [vsc]);

  useEffect(() => {
    const handleCsv = async (event: MessageEvent) => {
      const message = event.data;
      if (message.type !== "csvFileLoaded") return;
      if (message.payload?.error) {
        console.error("CSV load error", message.payload.error);
        return;
      }
      const content: string = message.payload.content;
      try {
        const rows = await parseCsvString(content);
        if (!rows || rows.length === 0) {
          setCsvHeader(null);
          setCsvRows([]);
          setCsvPath(message.payload.path || null);
          setSelectedRowIdx(null);
          return;
        }
        const [header, ...data] = rows;
        setCsvHeader(header!);
        setCsvRows(data);
        setCsvPath(message.payload.path || null);
        setSelectedRowIdx(null);
      } catch (error) {
        console.error(
          "Failed to parse CSV",
          JSON.stringify({ error: String(error) }),
        );
      }
    };
    window.addEventListener("message", handleCsv);
    return () => window.removeEventListener("message", handleCsv);
  }, []);

  useEffect(() => {
    const handle = (event: MessageEvent) => {
      const message = event.data;
      if (message.type !== "attachmentsLoaded") return;
      if (message.payload?.error) {
        console.error("Attachments load error", message.payload.error);
        return;
      }
      const items: any[] = Array.isArray(message.payload?.items)
        ? message.payload.items
        : [];
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
    };
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [activeModelKey, modelConfigs, updateModelConfig]);

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
    vsc.postMessage({ type: "requestCsvPick" });
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
    setCollapsedResults({});
    setCollapsedModelSettings({});
    setExpandedRequest({});
    setExpandedResponse({});

    const payload = {
      promptId,
      promptText,
      variables,
      runs,
      runSettings,
      models: preparedModels.map((model) => ({
        key: model.key,
        modelId: model.modelId,
        providerId: model.providerId,
        label: model.label ?? model.modelId,
        options: model.generationOptions,
        tools: model.caps.supportsTools ? (model.parsedTools ?? null) : null,
        providerOptions: model.providerOptions ?? null,
        reasoning: model.reasoning,
        attachments: model.filteredAttachments,
      })),
    };

    vsc.postMessage({ type: "executePrompt", payload });
  };

  const handleExecuteRef = useRef<() => void>(() => {});
  handleExecuteRef.current = handleExecute;

  const handleClear = () => {
    setExecutionState({
      isLoading: false,
      results: [],
      error: null,
    });
    setCollapsedResults({});
    setCollapsedModelSettings({});
    setExpandedRequest({});
    setExpandedResponse({});
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (
        message.type === "promptExecutionResult" &&
        message.payload?.promptId === promptId
      ) {
        const results: RunResult[] = Array.isArray(message.payload.results)
          ? message.payload.results
          : [];
        setExecutionState({
          isLoading: false,
          results,
          error: message.payload.error || null,
          timestamp: message.payload.timestamp || Date.now(),
        });
        setCollapsedResults({});
        setCollapsedModelSettings({});
        setExpandedRequest({});
        setExpandedResponse({});
        setActiveResultIndex(0);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [promptId]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type !== "executePromptFromCommand") return;
      handleExecuteRef.current();
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    setActiveResultIndex((idx) => {
      if (executionState.results.length === 0) return 0;
      return Math.min(idx, executionState.results.length - 1);
    });
  }, [executionState.results.length]);

  if (!prompt) return null;

  const hasVariables = prompt.vars && prompt.vars.length > 0;

  const renderResultCard = (result: RunResult, index: number) => {
    if (!result) return null;
    const isVerticalLayout = resultsLayout === "vertical";
    const collapsed = isVerticalLayout ? !!collapsedResults[index] : false;
    const modelEntry = result.model?.id
      ? models.find((model) => model.id === result.model?.id) || null
      : null;

    const titleParts: string[] = [];
    if (result.model?.label) titleParts.push(result.model.label);
    if (result.runLabel) titleParts.push(result.runLabel);
    if (result.label && !titleParts.includes(result.label))
      titleParts.push(result.label);
    const headerTitle = titleParts.length
      ? titleParts.join(" • ")
      : `Result ${index + 1}`;

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

    const textTab = textViewTab[index] ?? "markdown";
    const modelSettingsCollapsed = collapsedModelSettings[index] ?? true;

    return (
      <div className="border border-gray-200 rounded">
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {isVerticalLayout && (
              <button
                className="px-2 py-1 border border-gray-300 rounded text-xs"
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
            <span className="text-sm font-medium text-gray-700">
              {headerTitle}
            </span>
            {!result.success && (
              <span className="text-xs text-red-600">Failed</span>
            )}
          </div>
          {executionState.timestamp && (
            <span className="text-xs text-gray-500">
              {new Date(executionState.timestamp).toLocaleString()}
            </span>
          )}
        </div>
        {!collapsed && (
          <div className="p-3 space-y-3">
            {result.error && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-red-700">Error</h5>
                <div className="p-3 bg-red-50 rounded border border-red-300">
                  <pre className="text-sm text-red-900 whitespace-pre-wrap">
                    {result.error}
                  </pre>
                </div>
              </div>
            )}

            {modelSettingsPayload && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-medium text-gray-700">
                    Model Settings
                  </h5>
                  <button
                    className="text-xs text-blue-600 hover:underline"
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
                  <div className="p-3 bg-gray-50 rounded border border-gray-300 overflow-auto">
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
                  <h5 className="text-sm font-medium text-gray-700">Request</h5>
                  <button
                    className="text-xs text-blue-600 hover:underline"
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
                  <div className="p-3 bg-gray-50 rounded border border-gray-300 overflow-auto">
                    <JsonView
                      value={result.request as object}
                      displayObjectSize={false}
                      shouldExpandNodeInitially={shouldExpandNodeInitially}
                    />
                  </div>
                )}
              </div>
            )}

            {(result.text || result.response || result.prompt) && (
              <div className="space-y-2">
                {result.prompt && (
                  <div className="space-y-1">
                    <h5 className="text-sm font-medium text-gray-700">
                      User Message
                    </h5>
                    <div className="p-3 bg-white rounded border border-gray-200">
                      <pre className="text-xs whitespace-pre-wrap overflow-x-auto">
                        {result.prompt}
                      </pre>
                    </div>
                  </div>
                )}
                {(() => {
                  const text = (result.text ?? "").trim();
                  let parsedTextJson: any = null;
                  if (text)
                    try {
                      parsedTextJson = JSON.parse(text);
                    } catch (error) {}
                  if (parsedTextJson)
                    return (
                      <div className="space-y-2">
                        <div className="p-3 bg-gray-50 rounded border border-gray-300 overflow-auto">
                          <JsonView
                            value={parsedTextJson}
                            displayObjectSize={false}
                            shouldExpandNodeInitially={
                              shouldExpandNodeInitially
                            }
                          />
                        </div>
                        <details className="text-xs">
                          <summary className="cursor-pointer select-none text-gray-600">
                            Raw text
                          </summary>
                          <pre className="mt-1 p-2 bg-white rounded border border-gray-200 whitespace-pre-wrap overflow-x-auto text-xs">
                            {text}
                          </pre>
                        </details>
                      </div>
                    );
                  if (text)
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <button
                            type="button"
                            className={`px-2 py-1 border border-gray-300 rounded ${textTab === "markdown" ? "bg-gray-200" : "bg-white"}`}
                            onClick={() =>
                              setTextViewTab((prev) => ({
                                ...prev,
                                [index]: "markdown",
                              }))
                            }
                          >
                            Markdown
                          </button>
                          <button
                            type="button"
                            className={`px-2 py-1 border border-gray-300 rounded ${textTab === "raw" ? "bg-gray-200" : "bg-white"}`}
                            onClick={() =>
                              setTextViewTab((prev) => ({
                                ...prev,
                                [index]: "raw",
                              }))
                            }
                          >
                            Raw
                          </button>
                        </div>
                        {textTab === "markdown" ? (
                          <div className="p-3 bg-white rounded border border-gray-200">
                            <MarkdownPreview source={text} />
                          </div>
                        ) : (
                          <div className="p-3 bg-white rounded border border-gray-200">
                            <pre className="text-xs whitespace-pre-wrap overflow-x-auto">
                              {text}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  return null;
                })()}

                {result.response && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h6 className="text-xs font-medium text-gray-600">
                        Response JSON
                      </h6>
                      <button
                        className="text-xs text-blue-600 hover:underline"
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
                      <div className="p-3 bg-gray-50 rounded border border-gray-300 overflow-auto">
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
          <h4 className="text-sm font-semibold text-gray-800">Model</h4>
          <button
            type="button"
            onClick={handleAddModel}
            disabled={modelsLoading && models.length === 0}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-xs font-medium rounded hover:bg-gray-50 disabled:opacity-60"
          >
            {modelConfigs.length > 1 ? "Add model" : "Multi model"}
          </button>
        </div>
        {modelsError && (
          <div className="text-xs text-red-600">{modelsError}</div>
        )}
        {modelsLoading && models.length === 0 && (
          <div className="text-xs text-gray-600">Loading models…</div>
        )}
        {modelConfigs.length === 0 && !modelsLoading && (
          <div className="text-xs text-gray-600">
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
              <div
                key={config.key}
                className="border border-gray-200 rounded p-3 bg-white space-y-3"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">
                      Provider
                    </label>
                    <select
                      className="min-w-[160px] px-3 py-1.5 border border-gray-300 rounded text-sm"
                      value={config.providerId ?? ""}
                      onChange={(event) =>
                        handleProviderChange(config, event.target.value)
                      }
                      disabled={providerOptions.length === 0}
                    >
                      <option value="" disabled>
                        Select provider
                      </option>
                      {providerOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.provider && (
                      <span className="text-xs text-red-600">
                        {errors.provider}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">
                      Model
                    </label>
                    <select
                      className="min-w-[200px] px-3 py-1.5 border border-gray-300 rounded text-sm"
                      value={config.modelId ?? ""}
                      onChange={(event) =>
                        handleModelChange(config, event.target.value || null)
                      }
                      disabled={modelOptions.length === 0}
                    >
                      <option value="" disabled>
                        Select model
                      </option>
                      {modelOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.model && (
                      <span className="text-xs text-red-600">
                        {errors.model}
                      </span>
                    )}
                  </div>

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
                      className="ml-auto inline-flex items-center justify-center h-6 w-6 rounded-full border border-red-300 text-red-500 text-xs hover:bg-red-50"
                      title="Remove model"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {config.modelId && (
                  <div className="flex items-center gap-2 text-[10px] flex-wrap">
                    {caps.supportsImages && (
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        Images
                      </span>
                    )}
                    {caps.supportsVideo && (
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        Video
                      </span>
                    )}
                    {caps.supportsFiles && (
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Files
                      </span>
                    )}
                    {caps.supportsTools && (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Tools
                      </span>
                    )}
                    {caps.supportsReasoning && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        Reasoning
                      </span>
                    )}
                  </div>
                )}

                {isExpanded && (
                  <div className="space-y-4 border border-gray-100 rounded p-3 bg-gray-50">
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
                                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-xs font-medium rounded hover:bg-gray-50 whitespace-nowrap"
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
                                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 bg-white text-gray-700 text-xs font-medium rounded hover:bg-gray-50 whitespace-nowrap"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                            {attachments.length > 0 && (
                              <span className="text-xs text-gray-600">
                                {attachments.length} attachment
                                {attachments.length > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          {attachments.length > 0 && (
                            <div className="p-2 bg-white border border-gray-200 rounded">
                              <ul className="text-xs text-gray-700 space-y-1">
                                {attachments.map(
                                  (attachment, attachmentIdx) => (
                                    <li
                                      key={`${attachment.path}-${attachmentIdx}`}
                                      className="flex justify-between"
                                    >
                                      <span className="truncate">
                                        {attachment.name}
                                      </span>
                                      <span className="text-gray-500 ml-2">
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
                      <label className="text-xs text-gray-700">
                        Max tokens
                        <input
                          type="number"
                          className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs"
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
                      <label className="text-xs text-gray-700">
                        Temperature
                        <input
                          type="number"
                          className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs"
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
                      <label className="text-xs text-gray-700">
                        Top P
                        <input
                          type="number"
                          className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs"
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
                      <label className="text-xs text-gray-700">
                        Top K
                        <input
                          type="number"
                          className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs"
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
                      <label className="text-xs text-gray-700">
                        Presence penalty
                        <input
                          type="number"
                          className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs"
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
                      <label className="text-xs text-gray-700">
                        Frequency penalty
                        <input
                          type="number"
                          className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs"
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
                      <label className="text-xs text-gray-700">
                        Stop sequences
                        <input
                          type="text"
                          className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs"
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
                      <label className="text-xs text-gray-700">
                        Seed
                        <input
                          type="number"
                          className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs"
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
                      <label className="inline-flex items-center gap-2 text-xs text-gray-700">
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
                        <label className="text-xs text-gray-700">
                          Reasoning effort
                          <select
                            className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs"
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
                        <label className="text-xs text-gray-700">
                          Budget tokens (optional)
                          <input
                            type="number"
                            className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs"
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
                      <label className="text-xs text-gray-700">
                        Tools (JSON)
                        <textarea
                          className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                          rows={3}
                          value={config.toolsJson}
                          onChange={(event) =>
                            updateToolsJson(config.key, event.target.value)
                          }
                          placeholder="null"
                        />
                        {errors.tools && (
                          <span className="text-xs text-red-600">
                            {errors.tools}
                          </span>
                        )}
                      </label>
                      <label className="text-xs text-gray-700">
                        Provider Options (JSON)
                        <textarea
                          className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono"
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
                          <span className="text-xs text-red-600">
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
                className="inline-flex items-center px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700 whitespace-nowrap"
              >
                {usingCsv ? "Reload CSV" : "Load CSV"}
              </button>
              {usingCsv && (
                <button
                  onClick={handleClearCsv}
                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 bg-white text-gray-700 text-xs font-medium rounded hover:bg-gray-50 whitespace-nowrap"
                >
                  Clear CSV
                </button>
              )}
            </div>

            {usingCsv && (
              <div className="min-w-0 flex-1 text-right">
                <span className="text-xs text-gray-600 font-mono truncate block">
                  {csvFileLabel ? `Loaded: ${csvFileLabel}` : "CSV loaded"}
                </span>
              </div>
            )}
          </div>

          {!usingCsv && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              Load a CSV to enable dataset options.
            </div>
          )}

          {usingCsv && (
            <>
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Run Scope</h5>
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
                  <h5 className="text-sm font-medium text-gray-700">
                    Select Row
                  </h5>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
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
                  <p className="text-xs text-gray-600">
                    Selecting a row fills the variables below and overrides
                    manual input.
                  </p>
                </div>
              )}

              {datasetMode === "range" && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">
                    Enter CSV Range
                  </h5>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={csvRows.length}
                      value={rangeStart}
                      onChange={(event) => setRangeStart(event.target.value)}
                      placeholder="Start (1)"
                      className="w-28 px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="number"
                      min={1}
                      max={csvRows.length}
                      value={rangeEnd}
                      onChange={(event) => setRangeEnd(event.target.value)}
                      placeholder={`End (${csvRows.length})`}
                      className="w-28 px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    Range is inclusive. 1 to {csvRows.length} available.
                  </p>
                </div>
              )}

              {datasetMode === "all" && (
                <div className="text-xs text-gray-700">
                  All rows will run ({csvRows.length}).
                </div>
              )}
            </>
          )}
        </div>
      )}

      {hasVariables && inputSource === "manual" && (
        <div className="space-y-3">
          <h5 className="text-sm font-medium text-gray-700">Variables</h5>
          {prompt.vars!.map((variable: PromptVar) => (
            <div key={variable.exp} className="space-y-1">
              <label className="block text-sm font-medium text-gray-600">
                {variable.exp}
              </label>
              <input
                type="text"
                value={variables[variable.exp] || ""}
                onChange={(event) =>
                  handleVariableChange(variable.exp, event.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder={`Enter value for ${variable.exp}`}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleExecute}
          disabled={executionState.isLoading || !canExecute()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {executionState.isLoading ? "Running..." : "Run Prompt"}
        </button>

        {(executionState.results.length > 0 || executionState.error) && (
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-700"
          >
            Clear
          </button>
        )}
      </div>

      {executionState.results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium text-gray-700">Results</h5>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setResultsLayout("vertical")}
                className={`px-2 py-1 text-xs font-medium rounded border ${resultsLayout === "vertical" ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-300 text-gray-600 bg-white"}`}
              >
                Vertical
              </button>
              <button
                type="button"
                onClick={() => setResultsLayout("horizontal")}
                className={`px-2 py-1 text-xs font-medium rounded border ${resultsLayout === "horizontal" ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-300 text-gray-600 bg-white"}`}
              >
                Horizontal
              </button>
              <button
                type="button"
                onClick={() => setResultsLayout("carousel")}
                className={`px-2 py-1 text-xs font-medium rounded border ${resultsLayout === "carousel" ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-300 text-gray-600 bg-white"}`}
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
                  <span className="text-xs text-gray-600">
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
                      className="h-7 w-7 inline-flex items-center justify-center border border-gray-300 rounded text-gray-600 disabled:opacity-50"
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
                      className="h-7 w-7 inline-flex items-center justify-center border border-gray-300 rounded text-gray-600 disabled:opacity-50"
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
          <h5 className="text-sm font-medium text-red-700">Error</h5>
          <div className="p-3 bg-red-50 rounded border border-red-300">
            <pre className="text-sm text-red-900 whitespace-pre-wrap">
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
    <div className="text-xs text-gray-700">
      <div className="inline-flex items-center gap-2 px-2 py-1 border border-gray-200 rounded bg-white">
        <span className="font-medium">Estimated cost:</span>
        <span>${total.toFixed(6)}</span>
        <span className="text-gray-500">
          (in: {inputTokens} • ${inputCost.toFixed(6)}, out: {outputTokens} • $
          {outputCost.toFixed(6)})
        </span>
      </div>
    </div>
  );
}
