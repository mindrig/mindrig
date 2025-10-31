import { DatasetDatasource } from "@wrkspc/core/dataset";
import { Button } from "@wrkspc/ds";
import { Field } from "enso";

export namespace DatasourceDataset {
  export interface Props {
    field: Field<DatasetDatasource>;
    // usingCsv: boolean;
    // csvFileLabel: string | null;
    // csvRows: string[][];
    // headers: string[] | null;
    // datasetMode: DatasetSelection.Type;
    // selectedRowIdx: number | null;
    // rangeStart: string;
    // rangeEnd: string;
    // onDatasetModeChange: (mode: DatasetSelection.Type) => void;
    // onSelectRow: (index: number | null) => void;
    // onRangeStartChange: (value: string) => void;
    // onRangeEndChange: (value: string) => void;
    // onLoadCsv: () => void;
    // onClearCsv: () => void;
  }
}

export function DatasourceDataset(props: DatasourceDataset.Props) {
  const { field } = props;

  const usingCsv = false;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            size="xsmall"
            // onClick={onLoadCsv}
          >
            {usingCsv ? "Reload CSV" : "Load CSV"}
          </Button>

          {usingCsv && (
            <Button
              size="xsmall"
              // onClick={onClearCsv}
            >
              Clear CSV
            </Button>
          )}
        </div>

        {usingCsv && (
          <div className="min-w-0 flex-1 text-right">
            {/* <span className="text-xs font-mono truncate block">
              {csvFileLabel ? `Loaded: ${csvFileLabel}` : "CSV loaded"}
            </span> */}
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
          {/* <div className="space-y-2">
            <h5 className="text-sm font-medium">Run Scope</h5>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="dataset-mode"
                  value="row"
                  checked={datasetMode === "row"}
                  onChange={() => onDatasetModeChange("row")}
                />
                Select row
              </label>

              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="dataset-mode"
                  value="range"
                  checked={datasetMode === "range"}
                  onChange={() => onDatasetModeChange("range")}
                />
                Enter CSV range
              </label>

              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="dataset-mode"
                  value="all"
                  checked={datasetMode === "all"}
                  onChange={() => onDatasetModeChange("all")}
                />
                All rows
              </label>
            </div>
          </div> */}

          {/* {datasetMode === "row" && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Select Row</h5>
              <select
                className="w-full px-3 py-2 border rounded text-sm"
                value={selectedRowIdx ?? ""}
                onChange={(event) => {
                  const { value } = event.target;
                  onSelectRow(value === "" ? null : Number(value));
                }}
              >
                <option value="" disabled>
                  Choose a row
                </option>

                {csvRows.map((row, idx) => {
                  const label = headers
                    ? headers
                        .slice(0, Math.min(headers.length, 5))
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
                Selecting a row fills the variables below and overrides manual
                input.
              </p>
            </div>
          )} */}

          {/* {datasetMode === "range" && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Enter CSV Range</h5>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={csvRows.length}
                  value={rangeStart}
                  onChange={(event) => onRangeStartChange(event.target.value)}
                  placeholder="Start (1)"
                  className="w-28 px-3 py-2 border rounded text-sm"
                />

                <span>to</span>

                <input
                  type="number"
                  min={1}
                  max={csvRows.length}
                  value={rangeEnd}
                  onChange={(event) => onRangeEndChange(event.target.value)}
                  placeholder={`End (${csvRows.length})`}
                  className="w-28 px-3 py-2 border rounded text-sm"
                />
              </div>

              <p className="text-xs">
                Range is inclusive. 1 to {csvRows.length} available.
              </p>
            </div>
          )} */}

          {/* {datasetMode === "all" && (
            <div className="text-xs">All rows will run ({csvRows.length}).</div>
          )} */}
        </>
      )}
    </div>
  );
}
