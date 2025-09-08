import { createGateway } from "@ai-sdk/gateway";
import { getModelCapabilities, setModelsDevData } from "@/modelsDevCaps";
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
  }
}

interface ExecutionState {
  isLoading: boolean;
  response: object | null;
  request: object | null;
  error: string | null;
  timestamp?: number;
}

export function PromptExecution({
  prompt,
  vscode,
  vercelGatewayKey,
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
    response: null,
    request: null,
    error: null,
  });

  // Generate unique prompt ID for state persistence
  const promptId = prompt
    ? `${prompt.file}:${prompt.span.start}-${prompt.span.end}`
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
      setExecutionState({
        isLoading: false,
        response: promptState.lastResponse?.response || null,
        request: promptState.lastResponse?.request || null,
        error: promptState.lastResponse?.error || null,
        timestamp: promptState.lastResponse?.timestamp,
      });
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
        response: null,
        request: null,
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
        executionState.response || executionState.error
          ? {
              success: !executionState.error,
              response: executionState.response,
              request: executionState.request,
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
    text: string,
    vars: Record<string, string>,
  ): string => {
    if (!prompt?.vars || prompt.vars.length === 0) {
      return text;
    }

    const sortedVars = [...prompt.vars].reverse();

    let result = text;
    console.log("!!!", { text, sortedVars });
    for (const variable of sortedVars) {
      const value = vars[variable.exp] || "";
      result =
        result.slice(
          0,
          // NOTE: works for ${ only, 2 for ${, one for the prompt's opening `
          variable.span.start - prompt.span.start - 3,
        ) +
        value +
        result.slice(variable.span.end - prompt.span.start);
    }

    return result;
  };

  const canExecute = () => {
    if (!prompt?.vars) return true;
    return prompt.vars.every((v) => variables[v.exp]?.trim());
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

    const substitutedPrompt = substituteVariables(prompt.text, variables);

    setExecutionState({
      isLoading: true,
      response: null,
      request: null,
      error: null,
    });

    vscode.postMessage({
      type: "executePrompt",
      payload: {
        promptText: prompt.text,
        substitutedPrompt,
        variables,
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
      response: null,
      request: null,
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
        setExecutionState({
          isLoading: false,
          response: message.payload.success ? message.payload.response : null,
          request: message.payload.success ? message.payload.request : null,
          error: message.payload.success ? null : message.payload.error,
          timestamp: message.payload.timestamp || Date.now(),
          // attach usage for pricing info if present
          ...(message.payload.usage ? { usage: message.payload.usage } : {}),
        });
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

        {usingCsv && (
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
              Selecting a row fills the variables below and overrides manual
              input.
            </p>
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

        {hasVariables && !usingCsv && (
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

          {(executionState.response || executionState.error) && (
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-700"
            >
              Clear
            </button>
          )}
        </div>

        {executionState.request && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium text-gray-700">Request</h5>

              {executionState.timestamp && (
                <span className="text-xs text-gray-500">
                  {new Date(executionState.timestamp).toLocaleString()}
                </span>
              )}
            </div>

            <div className="p-3 bg-gray-50 rounded border border-gray-300">
              <pre className="text-xs text-gray-900 whitespace-pre-wrap font-mono overflow-x-auto">
                {JSON.stringify(executionState.request, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {executionState.response && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium text-gray-700">Response</h5>
            </div>

            <div className="p-3 bg-gray-50 rounded border border-gray-300">
              <pre className="text-xs text-gray-900 whitespace-pre-wrap font-mono overflow-x-auto">
                {JSON.stringify(executionState.response, null, 2)}
              </pre>
            </div>
            {/* Pricing info: computed from usage + selected model pricing if available */}
            <PricingInfo
              usage={(executionState as any).usage}
              selectedModel={
                models.find((m) => m.id === selectedModelId) as any
              }
            />
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
