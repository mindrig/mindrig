import { useAssessmentDatasource } from "@/aspects/assessment/hooks/useAssessmentDatasource";

export function DatasourceSelector() {
  const {
    promptVariables,
    inputSource,
    setInputSource,
    datasetMode,
    setDatasetMode,
    variables,
    handleVariableChange,
    csvRows,
    csvHeader,
    csvFileLabel,
    selectedRowIdx,
    handleSelectRow,
    handleLoadCsv,
    handleClearCsv,
    rangeStart,
    setRangeStart,
    rangeEnd,
    setRangeEnd,
    usingCsv,
  } = useAssessmentDatasource();

  const hasVariables = Boolean(promptVariables && promptVariables.length > 0);

  return (
    <div className="space-y-3">
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
            Manual input
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
                    onChange={(event) =>
                      handleSelectRow(
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                      )
                    }
                  >
                    <option value="" disabled>
                      Choose a row
                    </option>
                    {csvRows.map((row, idx) => {
                      const label = csvHeader
                        ? csvHeader
                            .slice(0, Math.min(csvHeader.length, 5))
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

      {inputSource === "manual" && hasVariables && (
        <div className="space-y-3">
          <h5 className="text-sm font-medium">Variables</h5>
          {(promptVariables ?? []).map((variable) => (
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
    </div>
  );
}
