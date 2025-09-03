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
  }
}

interface ExecutionState {
  isLoading: boolean;
  response: object | null;
  request: object | null;
  error: string | null;
  timestamp?: number;
}

export function PromptExecution({ prompt, vscode }: PromptExecution.Props) {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [csvPath, setCsvPath] = useState<string | null>(null);
  const [csvHeader, setCsvHeader] = useState<string[] | null>(null);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [selectedRowIdx, setSelectedRowIdx] = useState<number | null>(null);
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
    }
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
