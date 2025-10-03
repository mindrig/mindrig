import type { PromptVar } from "@mindrig/types";
import { computeVariablesFromRow } from "@wrkspc/dataset";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

type InputSource = "manual" | "dataset";
type DatasetMode = "row" | "range" | "all";

export type DatasourceContextValue = {
  promptVariables: PromptVar[] | undefined | null;
  inputSource: InputSource;
  setInputSource: (source: InputSource) => void;
  datasetMode: DatasetMode;
  setDatasetMode: (mode: DatasetMode) => void;
  variables: Record<string, string>;
  setVariables: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  csvPath: string | null;
  setCsvPath: (path: string | null) => void;
  csvHeader: string[] | null;
  setCsvHeader: (header: string[] | null) => void;
  csvRows: string[][];
  setCsvRows: (rows: string[][]) => void;
  selectedRowIdx: number | null;
  setSelectedRowIdx: (index: number | null) => void;
  rangeStart: string;
  setRangeStart: (value: string) => void;
  rangeEnd: string;
  setRangeEnd: (value: string) => void;
  handleVariableChange: (name: string, value: string) => void;
  handleSelectRow: (index: number | null) => void;
  handleLoadCsv: () => void;
  handleClearCsv: () => void;
  usingCsv: boolean;
  csvFileLabel: string | null;
};

const AssessmentDatasourceContext = createContext<DatasourceContextValue | null>(
  null,
);

interface UseAssessmentDatasourceStateOptions {
  promptVariables?: PromptVar[] | undefined | null;
  onRequestCsv?: () => void;
}

export function useAssessmentDatasourceState(
  options: UseAssessmentDatasourceStateOptions = {},
) {
  const { promptVariables = [], onRequestCsv } = options;
  const [inputSource, setInputSource] = useState<InputSource>("manual");
  const [datasetMode, setDatasetMode] = useState<DatasetMode>("row");
  const [variables, setVariablesState] = useState<Record<string, string>>({});
  const [csvPath, setCsvPath] = useState<string | null>(null);
  const [csvHeader, setCsvHeader] = useState<string[] | null>(null);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [selectedRowIdx, setSelectedRowIdx] = useState<number | null>(null);
  const [rangeStart, setRangeStart] = useState<string>("");
  const [rangeEnd, setRangeEnd] = useState<string>("");

  const usingCsv = csvRows.length > 0 && !!csvHeader;
  const csvFileLabel = useMemo(() => {
    if (!csvPath) return null;
    const base = csvPath.split(/[/\\]/).pop();
    return base ?? csvPath;
  }, [csvPath]);

  const handleVariableChange = useCallback((name: string, value: string) => {
    setVariablesState((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSelectRow = useCallback(
    (index: number | null) => {
      if (
        index === null ||
        Number.isNaN(index) ||
        index < 0 ||
        index >= csvRows.length
      ) {
        setSelectedRowIdx(null);
        return;
      }

      setSelectedRowIdx(index);
      const row = csvRows[index];
      if (!row) return;

      const headersToUse = csvHeader && csvHeader.length ? csvHeader : null;
      const mapped = computeVariablesFromRow(row, headersToUse, promptVariables);
      setVariablesState(mapped);
    },
    [csvHeader, csvRows, promptVariables],
  );

  const handleLoadCsv = useCallback(() => {
    onRequestCsv?.();
  }, [onRequestCsv]);

  const handleClearCsv = useCallback(() => {
    setCsvPath(null);
    setCsvHeader(null);
    setCsvRows([]);
    setSelectedRowIdx(null);
    setInputSource("manual");
    setDatasetMode("row");
    setRangeStart("");
    setRangeEnd("");

    if (promptVariables && promptVariables.length > 0) {
      const nextVariables: Record<string, string> = {};
      promptVariables.forEach((variable) => {
        nextVariables[variable.exp] = "";
      });
      setVariablesState(nextVariables);
    } else {
      setVariablesState({});
    }
  }, [promptVariables]);

  return {
    inputSource,
    setInputSource,
    datasetMode,
    setDatasetMode,
    variables,
    setVariables: setVariablesState,
    csvPath,
    setCsvPath,
    csvHeader,
    setCsvHeader,
    csvRows,
    setCsvRows,
    selectedRowIdx,
    setSelectedRowIdx,
    rangeStart,
    setRangeStart,
    rangeEnd,
    setRangeEnd,
    handleVariableChange,
    handleSelectRow,
    handleLoadCsv,
    handleClearCsv,
    usingCsv,
    csvFileLabel,
  };
}

export function AssessmentDatasourceProvider(props: {
  value: DatasourceContextValue;
  children: React.ReactNode;
}) {
  const { value, children } = props;
  return (
    <AssessmentDatasourceContext.Provider value={value}>
      {children}
    </AssessmentDatasourceContext.Provider>
  );
}

export function useAssessmentDatasource() {
  const ctx = useContext(AssessmentDatasourceContext);
  if (!ctx)
    throw new Error("useAssessmentDatasource must be used within AssessmentDatasourceProvider");
  return ctx;
}
