import type { PromptVar } from "@mindrig/types";

import { DatasourceDataset, type DatasetMode } from "./Dataset";
import { DatasourceVariables } from "./Variables";

export interface DatasourceSelectorProps {
  inputSource: "manual" | "dataset";
  promptVariables: PromptVar[] | undefined | null;
  variables: Record<string, string>;
  datasetMode: DatasetMode;
  csvRows: string[][];
  csvHeader: string[] | null;
  csvFileLabel: string | null;
  selectedRowIdx: number | null;
  rangeStart: string;
  rangeEnd: string;
  usingCsv: boolean;
  onInputSourceChange: (source: "manual" | "dataset") => void;
  onVariableChange: (name: string, value: string) => void;
  onDatasetModeChange: (mode: DatasetMode) => void;
  onSelectRow: (index: number | null) => void;
  onRangeStartChange: (value: string) => void;
  onRangeEndChange: (value: string) => void;
  onLoadCsv: () => void;
  onClearCsv: () => void;
}

export function DatasourceSelector(props: DatasourceSelectorProps) {
  const {
    inputSource,
    promptVariables,
    variables,
    datasetMode,
    csvRows,
    csvHeader,
    csvFileLabel,
    selectedRowIdx,
    rangeStart,
    rangeEnd,
    usingCsv,
    onInputSourceChange,
    onVariableChange,
    onDatasetModeChange,
    onSelectRow,
    onRangeStartChange,
    onRangeEndChange,
    onLoadCsv,
    onClearCsv,
  } = props;

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
              onChange={() => onInputSourceChange("manual")}
            />
            Manual input
          </label>
          <label className="inline-flex items-center gap-1">
            <input
              type="radio"
              name="input-source"
              value="dataset"
              checked={inputSource === "dataset"}
              onChange={() => onInputSourceChange("dataset")}
            />
            Use dataset
          </label>
        </div>
      </div>

      {inputSource === "dataset" && (
        <DatasourceDataset
          usingCsv={usingCsv}
          csvFileLabel={csvFileLabel}
          csvRows={csvRows}
          headers={csvHeader}
          datasetMode={datasetMode}
          selectedRowIdx={selectedRowIdx}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onDatasetModeChange={onDatasetModeChange}
          onSelectRow={onSelectRow}
          onRangeStartChange={onRangeStartChange}
          onRangeEndChange={onRangeEndChange}
          onLoadCsv={onLoadCsv}
          onClearCsv={onClearCsv}
        />
      )}

      {inputSource === "manual" && hasVariables && (
        <DatasourceVariables
          promptVariables={promptVariables}
          variables={variables}
          onVariableChange={onVariableChange}
        />
      )}
    </div>
  );
}
