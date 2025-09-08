import { getModelCapabilities, setModelsDevData } from "@/modelsDevCaps";
import { createGateway } from "@ai-sdk/gateway";
import type { Prompt, PromptVar } from "@mindcontrol/code-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { parseString as parseCsvString } from "smolcsv";

export namespace PromptExecution {
  export interface Props {
    prompt: Prompt | null;
    vscode: {
      postMessage: (message: any) => void;
      getState: () => any;
      setState: (state: any) => void;
    } | null;
    vercelGatewayKey: string | null;
    fileContent?: string | null;
  }
}

interface RunResult {
  success: boolean;
  request?: object | null;
  response?: object | null;
  usage?: any;
  error?: string | null;
  label?: string;
}

interface ExecutionState {
  isLoading: boolean;
  results: RunResult[];
  error: string | null;
  timestamp?: number;
}

export function PromptExecution({
  prompt,
  vscode,
  vercelGatewayKey,
  fileContent,
}: PromptExecution.Props) {
  const [modelsDevTick, setModelsDevTick] = useState(0);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [csvPath, setCsvPath] = useState<string | null>(null);
  const [csvHeader, setCsvHeader] = useState<string[] | null>(null);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [selectedRowIdx, setSelectedRowIdx] = useState<number | null>(null);
  const [models, setModels] = useState<
    Array<{
      id: string;
      name?: string;
      modelType?: string | null;
      specification?: { provider?: string };
    }>
  >([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [generationOptions, setGenerationOptions] = useState<{
    maxOutputTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
    stopSequences?: string; // CSV string in UI
    seed?: number;
  }>({});
  const [reasoningEnabled, setReasoningEnabled] = useState(false);
  const [reasoningEffort, setReasoningEffort] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [reasoningBudget, setReasoningBudget] = useState<number | "">("");
  const [toolsJson, setToolsJson] = useState<string>("null");
  const [providerOptionsJson, setProviderOptionsJson] = useState<string>("{}");
  const [toolsJsonError, setToolsJsonError] = useState<string | null>(null);
  const [providerOptionsError, setProviderOptionsError] = useState<
    string | null
  >(null);
  const [attachments, setAttachments] = useState<
    Array<{ path: string; name: string; mime?: string; dataBase64?: string }>
  >([]);
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
  const [collapsedResults, setCollapsedResults] = useState<Record<number, boolean>>(
    {},
  );

  // Generate unique prompt ID for state persistence
  const promptId = prompt
    ? `${prompt.file}:${prompt.span.outer.start}-${prompt.span.outer.end}`
    : null;

  // Load persistent state when prompt changes
  useEffect(() => {
    if (!promptId || !vscode) return;

    const state = vscode.getState() || {};
    const promptState = state[promptId];

    if (promptState) {
      setVariables(promptState.variables || {});
      if (promptState.csv) {
        setCsvPath(promptState.csv.path || null);
        setCsvHeader(promptState.csv.header || null);
        setCsvRows(promptState.csv.rows || []);
        setSelectedRowIdx(
          typeof promptState.csv.selectedRowIdx === "number"
            ? promptState.csv.selectedRowIdx
            : null,
        );
      } else {
        setCsvPath(null);
        setCsvHeader(null);
        setCsvRows([]);
        setSelectedRowIdx(null);
      }
      // Restore last results if present (new format), otherwise wrap legacy
      if (Array.isArray(promptState.lastResponse?.results)) {
        setExecutionState({
          isLoading: false,
          results: promptState.lastResponse.results,
          error: promptState.lastResponse?.error || null,
          timestamp: promptState.lastResponse?.timestamp,
        });
      } else {
        const legacyResponse = promptState.lastResponse;
        const results: RunResult[] = legacyResponse
          ? [
              {
                success: !!legacyResponse.success,
                request: legacyResponse.request || null,
                response: legacyResponse.response || null,
                error: legacyResponse.error || null,
              },
            ]
          : [];
        setExecutionState({
          isLoading: false,
          results,
          error: null,
          timestamp: legacyResponse?.timestamp,
        });
      }
      if (promptState.generationOptions) {
        setGenerationOptions({
          ...promptState.generationOptions,
          stopSequences: Array.isArray(
            promptState.generationOptions.stopSequences,
          )
            ? (promptState.generationOptions.stopSequences as string[]).join(
                ", ",
              )
            : promptState.generationOptions.stopSequences || "",
        });
      }
    } else {
      const initialVars: Record<string, string> = {};
      prompt?.vars?.forEach((v) => {
        initialVars[v.exp] = "";
      });
      setVariables(initialVars);
      setCsvPath(null);
      setCsvHeader(null);
      setCsvRows([]);
      setSelectedRowIdx(null);
      setExecutionState({
        isLoading: false,
        results: [],
        error: null,
      });
      setGenerationOptions({});
    }

    // restore globally selected model
    try {
      const s = vscode.getState?.();
      if (s && s.__selectedModelId) setSelectedModelId(s.__selectedModelId);
    } catch {}
  }, [promptId, vscode, prompt]);

  const saveState = useCallback(() => {
    if (!promptId || !vscode) return;

    const state = vscode.getState() || {};
    state[promptId] = {
      variables,
      csv:
        csvHeader || csvRows.length
          ? {
              path: csvPath,
              header: csvHeader,
              rows: csvRows,
              selectedRowIdx,
            }
          : undefined,
      generationOptions: generationOptions,
      lastResponse:
        (executionState.results?.length || executionState.error)
          ? {
              success:
                executionState.results.length > 0 &&
                executionState.results.every((r) => r.success),
              results: executionState.results,
              error: executionState.error,
              timestamp: executionState.timestamp || Date.now(),
            }
          : undefined,
    };
    vscode.setState(state);
  }, [
    promptId,
    vscode,
    variables,
    executionState,
    csvPath,
    csvHeader,
    csvRows,
    selectedRowIdx,
  ]);

  // Fetch available models when API key becomes available
  const fetchModels = useCallback(async () => {
    if (!vercelGatewayKey) return;
    setModelsLoading(true);
    setModelsError(null);
    try {
      const gateway = createGateway({ apiKey: vercelGatewayKey });
      const res = await gateway.getAvailableModels();
      const list = (res.models || []).filter(
        (m: any) => (m.modelType ?? "language") === "language",
      );
      setModels(list);
      if (!selectedModelId && list.length > 0) {
        setSelectedModelId(list[0]!.id);
        const state = vscode?.getState?.() || {};
        vscode?.setState?.({ ...state, __selectedModelId: list[0]!.id });
      }
    } catch (e) {
      console.error(
        "Failed to load models",
        JSON.stringify({ error: String(e) }),
      );
      setModelsError(
        e instanceof Error ? e.message : "Failed to load models from Gateway",
      );
    } finally {
      setModelsLoading(false);
    }
  }, [vercelGatewayKey, selectedModelId, vscode]);

  useEffect(() => {
    if (vercelGatewayKey) fetchModels();
  }, [vercelGatewayKey, fetchModels]);

  // Request models.dev capabilities from the extension (avoids CORS)
  useEffect(() => {
    if (!vscode) return;
    const onMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type !== "modelsDev") return;
      if (message.payload?.data) {
        setModelsDevData(message.payload.data);
        setModelsDevTick((t) => t + 1);
      }
    };
    window.addEventListener("message", onMessage);
    vscode.postMessage({ type: "getModelsDev" });
    return () => window.removeEventListener("message", onMessage);
  }, [vscode]);

  useEffect(() => {
    saveState();
  }, [saveState]);

  const handleVariableChange = (varName: string, value: string) => {
    setVariables((prev) => ({ ...prev, [varName]: value }));
  };

  const handleLoadCsv = () => {
    if (!vscode) return;
    vscode.postMessage({ type: "requestCsvPick" });
  };

  const selectedModelEntry = useCallback(() => {
    return models.find((m) => m.id === selectedModelId);
  }, [models, selectedModelId]);

  function selectedModelCapabilities() {
    const entry = selectedModelEntry();
    const id = entry?.id || "";
    const provider = entry?.specification?.provider || id.split("/")[0] || "";
    const caps = getModelCapabilities(provider, id);
    return { ...caps, provider };
  }

  const handleAttachFiles = () => {
    if (!vscode) return;
    const caps = selectedModelCapabilities();
    vscode.postMessage({
      type: "requestAttachmentPick",
      payload: { imagesOnly: caps.supportsImages && !caps.supportsFiles },
    });
  };

  const handleClearAttachments = () => {
    setAttachments([]);
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
    // Reset variables to empty so manual inputs show and are blank
    const initialVars: Record<string, string> = {};
    prompt?.vars?.forEach((v) => {
      initialVars[v.exp] = "";
    });
    setVariables(initialVars);
  };

  useEffect(() => {
    if (!vscode) return;
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
      } catch (e) {
        console.error("Failed to parse CSV", e);
      }
    };
    window.addEventListener("message", handleCsv);
    return () => window.removeEventListener("message", handleCsv);
  }, [vscode]);

  // Attachments loader
  useEffect(() => {
    if (!vscode) return;
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
      setAttachments(
        items.map((it) => ({
          path: it.path,
          name: it.name,
          mime: it.mime,
          dataBase64: it.dataBase64,
        })),
      );
    };
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [vscode]);

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

  const computeVariablesFromRow = useCallback(
    (row: string[]) => {
      if (!prompt?.vars || prompt.vars.length === 0)
        return {} as Record<string, string>;
      const next: Record<string, string> = {};
      if (headersToUse) {
        for (const variable of prompt.vars) {
          const idx = headersToUse.indexOf(variable.exp);
          if (idx !== -1) next[variable.exp] = row[idx] ?? "";
        }
      }
      // Fallback by position if headers didn't cover all
      if (Object.keys(next).length < (prompt.vars?.length ?? 0)) {
        prompt.vars.forEach((v, i) => {
          if (!next[v.exp]) next[v.exp] = row[i] ?? "";
        });
      }
      return next;
    },
    [prompt, headersToUse],
  );

  const handleSelectRow = (idxStr: string) => {
    const idx = Number(idxStr);
    if (Number.isNaN(idx) || idx < 0 || idx >= csvRows.length) return;
    setSelectedRowIdx(idx);
    const row = csvRows[idx];
    const mapped = computeVariablesFromRow(row!);
    setVariables(mapped);
  };

  const substituteVariables = (
    baseText: string,
    vars: Record<string, string>,
  ): string => {
    if (!prompt?.vars || prompt.vars.length === 0) return baseText;
    const innerStart = prompt.span.inner.start;
    // Replace from right to left to preserve indexes
    const sorted = [...prompt.vars].sort(
      (a, b) => (b.span.outer.start || 0) - (a.span.outer.start || 0),
    );
    let result = baseText;
    for (const v of sorted) {
      const value = vars[v.exp] || "";
      const s = Math.max(0, (v.span.outer.start ?? 0) - innerStart);
      const e = Math.max(s, (v.span.outer.end ?? 0) - innerStart);
      result = result.slice(0, s) + value + result.slice(e);
    }
    return result;
  };

  const canExecute = () => {
    if (!prompt?.vars) return true;
    if (inputSource === "manual") {
      return prompt.vars.every((v) => variables[v.exp]?.trim());
    }
    // dataset
    if (!usingCsv) return false;
    if (datasetMode === "row") return selectedRowIdx !== null;
    if (datasetMode === "all") return csvRows.length > 0;
    // range
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
    if (!prompt || !vscode || !canExecute()) return;

    // Parse JSON fields safely
    let tools: any = null;
    try {
      tools = toolsJson.trim() ? JSON.parse(toolsJson) : null;
      setToolsJsonError(null);
    } catch (e) {
      setToolsJsonError("Invalid JSON in tools");
      return;
    }

    let providerOptions: any = null;
    try {
      providerOptions = providerOptionsJson.trim()
        ? JSON.parse(providerOptionsJson)
        : null;
      setProviderOptionsError(null);
    } catch (e) {
      setProviderOptionsError("Invalid JSON in provider options");
      return;
    }

    const promptText = (() => {
      if (!fileContent) return prompt.exp;
      try {
        const s = prompt.span.inner.start;
        const e = prompt.span.inner.end;
        if (e > s && e <= fileContent.length) return fileContent.slice(s, e);
      } catch {}
      return prompt.exp;
    })();

    const substitutedPrompt = substituteVariables(promptText, variables);

    setExecutionState({
      isLoading: true,
      results: [],
      error: null,
    });

    // Build runs based on input source and dataset mode
    const runs: Array<{
      label: string;
      variables: Record<string, string>;
      substitutedPrompt: string;
    }> = [];

    if (inputSource === "manual") {
      runs.push({
        label: "Manual",
        variables,
        substitutedPrompt,
      });
    } else if (usingCsv) {
      if (datasetMode === "row") {
        const idx = selectedRowIdx ?? 0;
        const row = csvRows[idx]!;
        const vars = computeVariablesFromRow(row);
        runs.push({
          label: `Row ${idx + 1}`,
          variables: vars,
          substitutedPrompt: substituteVariables(promptText, vars),
        });
      } else if (datasetMode === "range") {
        const start = Math.max(1, Number(rangeStart));
        const end = Math.min(csvRows.length, Number(rangeEnd));
        for (let i = start - 1; i <= end - 1; i++) {
          const row = csvRows[i]!;
          const vars = computeVariablesFromRow(row);
          runs.push({
            label: `Row ${i + 1}`,
            variables: vars,
            substitutedPrompt: substituteVariables(promptText, vars),
          });
        }
      } else if (datasetMode === "all") {
        for (let i = 0; i < csvRows.length; i++) {
          const row = csvRows[i]!;
          const vars = computeVariablesFromRow(row);
          runs.push({
            label: `Row ${i + 1}`,
            variables: vars,
            substitutedPrompt: substituteVariables(promptText, vars),
          });
        }
      }
    }

    vscode.postMessage({
      type: "executePrompt",
      payload: {
        promptText,
        substitutedPrompt,
        variables,
        runSettings: {
          source: inputSource,
          datasetMode,
          selectedRowIdx,
          range:
            datasetMode === "range"
              ? {
                  start: Number(rangeStart) || 1,
                  end: Number(rangeEnd) || csvRows.length,
                }
              : undefined,
          totalRows: csvRows.length,
        },
        runs,
        promptId,
        modelId: selectedModelId || undefined,
        tools: selectedModelCapabilities().supportsTools
          ? (tools ?? null)
          : null,
        providerOptions: (() => {
          const merged = providerOptions ?? {};
          if (
            selectedModelCapabilities().supportsReasoning &&
            reasoningEnabled
          ) {
            (merged as any).reasoning = {
              effort: reasoningEffort,
              ...(reasoningBudget !== ""
                ? { budgetTokens: Number(reasoningBudget) }
                : {}),
            };
          }
          return merged;
        })(),
        toolChoice: undefined,
        attachments:
          selectedModelCapabilities().supportsImages ||
          selectedModelCapabilities().supportsFiles
            ? attachments
                .filter((a) => {
                  const caps = selectedModelCapabilities();
                  if (caps.supportsFiles) return true;
                  return (a.mime || "").startsWith("image/");
                })
                .map((a) => ({
                  name: a.name,
                  mime: a.mime || "application/octet-stream",
                  dataBase64: a.dataBase64 || "",
                }))
            : [],
        options: {
          maxOutputTokens: generationOptions.maxOutputTokens,
          temperature: generationOptions.temperature,
          topP: generationOptions.topP,
          topK: generationOptions.topK,
          presencePenalty: generationOptions.presencePenalty,
          frequencyPenalty: generationOptions.frequencyPenalty,
          stopSequences:
            generationOptions.stopSequences &&
            generationOptions.stopSequences.trim().length > 0
              ? generationOptions.stopSequences
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : undefined,
          seed: generationOptions.seed,
        },
      },
    });
  };

  const handleClear = () => {
    setExecutionState({
      isLoading: false,
      results: [],
      error: null,
    });
  };

  useEffect(() => {
    if (!vscode) return;

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (
        message.type === "promptExecutionResult" &&
        message.payload.promptId === promptId
      ) {
        const results: RunResult[] = Array.isArray(message.payload.results)
          ? message.payload.results
          : [
              {
                success: !!message.payload.success,
                request: message.payload.request || null,
                response: message.payload.response || null,
                error: message.payload.error || null,
              },
            ];
        setExecutionState({
          isLoading: false,
          results,
          error: null,
          timestamp: message.payload.timestamp || Date.now(),
        });
        setCollapsedResults({});
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [vscode, promptId]);

  if (!prompt) return null;

  const hasVariables = prompt.vars && prompt.vars.length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-100">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-700">Prompt Execution</h4>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 min-w-0">
          <select
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm max-w-[28rem] truncate"
            value={selectedModelId ?? ""}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedModelId(id);
              const s = vscode?.getState?.() || {};
              vscode?.setState?.({ ...s, __selectedModelId: id });
            }}
            disabled={!vercelGatewayKey || modelsLoading || models.length === 0}
            title={
              vercelGatewayKey
                ? modelsLoading
                  ? "Loading models…"
                  : "Select model"
                : "Set Vercel Gateway API key"
            }
          >
            <option value="" disabled>
              {modelsLoading ? "Loading…" : "Choose model"}
            </option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || m.id}
              </option>
            ))}
          </select>
          {selectedModelEntry() && (
            <img
              src={`https://models.dev/logos/${(selectedModelCapabilities().provider || "").toLowerCase()}.svg`}
              alt="provider"
              width={16}
              height={16}
              title={selectedModelCapabilities().provider}
              style={{ display: "inline-block" }}
            />
          )}
          <button
            className="px-2 py-1 border border-gray-300 rounded text-xs disabled:opacity-50"
            onClick={fetchModels}
            disabled={!vercelGatewayKey || modelsLoading}
            title={vercelGatewayKey ? "Refresh models" : "Set API key first"}
          >
            ↻
          </button>
          <button
            className="px-2 py-1 border border-gray-300 rounded text-xs"
            onClick={() => setShowOptions((v) => !v)}
            title="Show generation options"
          >
            options
          </button>
        </div>

        {/* Capability badges */}
        {selectedModelEntry() && (
          <div className="flex items-center gap-2 text-[10px]">
            {selectedModelCapabilities().supportsImages && (
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Images
              </span>
            )}
            {selectedModelCapabilities().supportsVideo && (
              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                Video
              </span>
            )}
            {selectedModelCapabilities().supportsFiles && (
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                Files
              </span>
            )}
            {selectedModelCapabilities().supportsTools && (
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Tools
              </span>
            )}
            {selectedModelCapabilities().supportsReasoning && (
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                Reasoning
              </span>
            )}
          </div>
        )}

        

        {/* Attachments and advanced config */}
        {(() => {
          const caps = selectedModelCapabilities();
          const canAttachAny = caps.supportsFiles || caps.supportsImages;
          if (!canAttachAny && attachments.length === 0) return null;
          return (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {caps.supportsFiles ? (
                    <button
                      onClick={handleAttachFiles}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-xs font-medium rounded hover:bg-gray-50 whitespace-nowrap"
                      title="Attach files/images"
                    >
                      Attach Files
                    </button>
                  ) : caps.supportsImages ? (
                    <button
                      onClick={handleAttachFiles}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-xs font-medium rounded hover:bg-gray-50 whitespace-nowrap"
                      title="Attach images"
                    >
                      Attach Images
                    </button>
                  ) : null}
                  {attachments.length > 0 && (
                    <button
                      onClick={handleClearAttachments}
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
                <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                  <ul className="text-xs text-gray-700 space-y-1">
                    {attachments.map((a, i) => (
                      <li
                        key={`${a.path}-${i}`}
                        className="flex justify-between"
                      >
                        <span className="truncate">{a.name}</span>
                        <span className="text-gray-500 ml-2">
                          {a.mime || ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })()}

        {/* Input source and dataset controls */}
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-700">Input Source</h5>
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
                    <h5 className="text-sm font-medium text-gray-700">Select Row</h5>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      value={selectedRowIdx ?? ""}
                      onChange={(e) => handleSelectRow(e.target.value)}
                    >
                      <option value="" disabled>
                        Choose a row
                      </option>
                      {csvRows.map((row, idx) => {
                        const label = headersToUse
                          ? headersToUse
                              .slice(0, Math.min(headersToUse.length, 5))
                              .map((h, i) => `${h}=${row[i] ?? ""}`)
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
                        onChange={(e) => setRangeStart(e.target.value)}
                        placeholder="Start (1)"
                        className="w-28 px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="number"
                        min={1}
                        max={csvRows.length}
                        value={rangeEnd}
                        onChange={(e) => setRangeEnd(e.target.value)}
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

        {showOptions && (
          <div className="border border-gray-100 rounded p-3 bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="text-xs text-gray-700">
                Max tokens
                <input
                  type="number"
                  className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  value={generationOptions.maxOutputTokens ?? ""}
                  onChange={(e) =>
                    setGenerationOptions((o) => ({
                      ...o,
                      maxOutputTokens:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    }))
                  }
                  min={1}
                />
              </label>
              <label className="text-xs text-gray-700">
                Temperature
                <input
                  type="number"
                  step="0.1"
                  className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  value={generationOptions.temperature ?? ""}
                  onChange={(e) =>
                    setGenerationOptions((o) => ({
                      ...o,
                      temperature:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label className="text-xs text-gray-700">
                Top P
                <input
                  type="number"
                  step="0.05"
                  min={0}
                  max={1}
                  className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  value={generationOptions.topP ?? ""}
                  onChange={(e) =>
                    setGenerationOptions((o) => ({
                      ...o,
                      topP:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label className="text-xs text-gray-700">
                Top K
                <input
                  type="number"
                  step="1"
                  className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  value={generationOptions.topK ?? ""}
                  onChange={(e) =>
                    setGenerationOptions((o) => ({
                      ...o,
                      topK:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label className="text-xs text-gray-700">
                Presence Penalty
                <input
                  type="number"
                  step="0.1"
                  min={-1}
                  max={1}
                  className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  value={generationOptions.presencePenalty ?? ""}
                  onChange={(e) =>
                    setGenerationOptions((o) => ({
                      ...o,
                      presencePenalty:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label className="text-xs text-gray-700">
                Frequency Penalty
                <input
                  type="number"
                  step="0.1"
                  min={-1}
                  max={1}
                  className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  value={generationOptions.frequencyPenalty ?? ""}
                  onChange={(e) =>
                    setGenerationOptions((o) => ({
                      ...o,
                      frequencyPenalty:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label className="text-xs text-gray-700 col-span-2">
                Stop Sequences (comma-separated)
                <input
                  type="text"
                  className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  value={generationOptions.stopSequences ?? ""}
                  onChange={(e) =>
                    setGenerationOptions((o) => ({
                      ...o,
                      stopSequences: e.target.value,
                    }))
                  }
                  placeholder=","
                />
              </label>
              <label className="text-xs text-gray-700">
                Seed
                <input
                  type="number"
                  step="1"
                  className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  value={generationOptions.seed ?? ""}
                  onChange={(e) =>
                    setGenerationOptions((o) => ({
                      ...o,
                      seed:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    }))
                  }
                />
              </label>
            </div>
            {selectedModelCapabilities().supportsReasoning && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="text-xs text-gray-700 inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={reasoningEnabled}
                    onChange={(e) => setReasoningEnabled(e.target.checked)}
                  />
                  Enable reasoning
                </label>
                <label className="text-xs text-gray-700">
                  Effort
                  <select
                    className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    value={reasoningEffort}
                    onChange={(e) => setReasoningEffort(e.target.value as any)}
                    disabled={!reasoningEnabled}
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
                    value={reasoningBudget}
                    onChange={(e) =>
                      setReasoningBudget(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    disabled={!reasoningEnabled}
                    min={0}
                  />
                </label>
              </div>
            )}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-xs text-gray-700">
                Tools (JSON)
                <textarea
                  className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                  rows={3}
                  value={toolsJson}
                  onChange={(e) => setToolsJson(e.target.value)}
                  placeholder="null"
                />
                {toolsJsonError && (
                  <span className="text-xs text-red-600">{toolsJsonError}</span>
                )}
              </label>
              <label className="text-xs text-gray-700">
                Provider Options (JSON)
                <textarea
                  className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                  rows={3}
                  value={providerOptionsJson}
                  onChange={(e) => setProviderOptionsJson(e.target.value)}
                  placeholder="{}"
                />
                {providerOptionsError && (
                  <span className="text-xs text-red-600">
                    {providerOptionsError}
                  </span>
                )}
              </label>
            </div>
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
                  onChange={(e) =>
                    handleVariableChange(variable.exp, e.target.value)
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
            {executionState.results.map((res, i) => {
              const collapsed = !!collapsedResults[i];
              return (
                <div key={i} className="border border-gray-200 rounded">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <button
                        className="px-2 py-1 border border-gray-300 rounded text-xs"
                        onClick={() =>
                          setCollapsedResults((prev) => ({
                            ...prev,
                            [i]: !collapsed,
                          }))
                        }
                        title={collapsed ? "Expand" : "Collapse"}
                      >
                        {collapsed ? "+" : "–"}
                      </button>
                      <span className="text-sm font-medium text-gray-700">
                        {res.label || `Result ${i + 1}`}
                      </span>
                      {!res.success && (
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
                      {res.error && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-red-700">
                            Error
                          </h5>
                          <div className="p-3 bg-red-50 rounded border border-red-300">
                            <pre className="text-sm text-red-900 whitespace-pre-wrap">
                              {res.error}
                            </pre>
                          </div>
                        </div>
                      )}
                      {res.request && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-gray-700">
                            Request
                          </h5>
                          <div className="p-3 bg-gray-50 rounded border border-gray-300">
                            <pre className="text-xs text-gray-900 whitespace-pre-wrap font-mono overflow-x-auto">
                              {JSON.stringify(res.request, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                      {res.response && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-gray-700">
                            Response
                          </h5>
                          <div className="p-3 bg-gray-50 rounded border border-gray-300">
                            <pre className="text-xs text-gray-900 whitespace-pre-wrap font-mono overflow-x-auto">
                              {JSON.stringify(res.response, null, 2)}
                            </pre>
                          </div>
                          <PricingInfo
                            usage={res.usage}
                            selectedModel={
                              models.find((m) => m.id === selectedModelId) as any
                            }
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
    </div>
  );
}

// Simple pricing info renderer
function PricingInfo(props: { usage: any; selectedModel: any }) {
  const { usage, selectedModel } = props;
  if (!usage || !selectedModel?.pricing) return null;
  const inputPerTok = Number(selectedModel.pricing.input || 0);
  const outputPerTok = Number((selectedModel.pricing as any).output || 0);
  const inputTokens =
    usage.inputTokens ?? usage.input ?? usage.promptTokens ?? 0;
  const outputTokens =
    usage.outputTokens ?? usage.output ?? usage.completionTokens ?? 0;
  const inputCost = inputTokens * inputPerTok;
  const outputCost = outputTokens * outputPerTok;
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
