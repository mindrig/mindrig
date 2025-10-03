import type { RenderOptions } from "@testing-library/react";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import type { DatasourceContextValue } from "@/aspects/assessment/hooks/useAssessmentDatasource";
import {
  AssessmentDatasourceProvider,
} from "@/aspects/assessment/hooks/useAssessmentDatasource";
import type { ResultsContextValue } from "@/aspects/assessment/hooks/useAssessmentResultsView";
import {
  AssessmentResultsProvider,
} from "@/aspects/assessment/hooks/useAssessmentResultsView";
import type { RunResult } from "@/aspects/assessment/types";

const noop = () => {};
const noopRecordUpdater = <T,>(updater: (prev: T) => T) => {
  updater({} as T);
};

export function createDatasourceContextValue(
  overrides: Partial<DatasourceContextValue> = {},
): DatasourceContextValue {
  return {
    promptVariables: [],
    inputSource: "manual",
    setInputSource: noop,
    datasetMode: "row",
    setDatasetMode: noop,
    variables: {},
    setVariables: noopRecordUpdater,
    csvPath: null,
    setCsvPath: noop,
    csvHeader: null,
    setCsvHeader: noop,
    csvRows: [],
    setCsvRows: noop,
    selectedRowIdx: null,
    setSelectedRowIdx: noop,
    rangeStart: "",
    setRangeStart: noop,
    rangeEnd: "",
    setRangeEnd: noop,
    handleVariableChange: noop,
    handleSelectRow: noop,
    handleLoadCsv: noop,
    handleClearCsv: noop,
    usingCsv: false,
    csvFileLabel: null,
    ...overrides,
  };
}

export function createResultsContextValue(
  overrides: Partial<ResultsContextValue> = {},
): ResultsContextValue {
  return {
    results: [],
    models: [],
    timestamp: Date.now(),
    layout: "vertical",
    onLayoutChange: noop,
    collapsedResults: {},
    onToggleCollapse: noop,
    collapsedModelSettings: {},
    onToggleModelSettings: noop,
    requestExpanded: {},
    onToggleRequest: noop,
    responseExpanded: {},
    onToggleResponse: noop,
    viewTabs: {},
    onChangeView: noop,
    activeResultIndex: 0,
    onActiveResultIndexChange: noop,
    ...overrides,
  };
}

export function createRunResult(
  overrides: Partial<RunResult> = {},
): RunResult {
  return {
    success: true,
    runId: "run-id",
    resultId: "result-id",
    label: "Result",
    runLabel: "Run",
    prompt: null,
    text: "",
    textParts: [],
    streaming: false,
    isLoading: false,
    nonStreamingNote: null,
    request: null,
    response: null,
    usage: null,
    totalUsage: null,
    steps: null,
    error: null,
    model: {
      key: "model-key",
      id: "model-id",
      providerId: "provider",
      label: "Model",
      settings: {
        options: {},
        reasoning: { enabled: false, effort: "medium", budgetTokens: "" },
        providerOptions: null,
        tools: null,
        attachments: [],
      },
    },
    streamingState: null,
    warnings: null,
    finishReason: null,
    ...overrides,
  };
}

export function renderWithAssessmentProviders(
  ui: ReactElement,
  options: {
    datasource?: Partial<DatasourceContextValue>;
    results?: Partial<ResultsContextValue>;
    renderOptions?: RenderOptions;
  } = {},
) {
  const datasourceValue = createDatasourceContextValue(options.datasource);
  const resultsValue = createResultsContextValue(options.results);

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AssessmentDatasourceProvider value={datasourceValue}>
      <AssessmentResultsProvider value={resultsValue}>
        {children}
      </AssessmentResultsProvider>
    </AssessmentDatasourceProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options.renderOptions });
}
