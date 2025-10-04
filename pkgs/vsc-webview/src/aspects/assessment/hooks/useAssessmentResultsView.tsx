import { createContext, useContext, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { AvailableModel } from "@/aspects/models/Context";
import type { RunResult } from "@/aspects/assessment/types";
import type { ResultsLayout } from "../persistence";

export interface AssessmentResultsState {
  layout: ResultsLayout;
  setLayout: (layout: ResultsLayout) => void;
  collapsedResults: Record<number, boolean>;
  setCollapsedResults: Dispatch<SetStateAction<Record<number, boolean>>>;
  collapsedModelSettings: Record<number, boolean>;
  setCollapsedModelSettings: Dispatch<SetStateAction<Record<number, boolean>>>;
  requestExpanded: Record<number, boolean>;
  setRequestExpanded: Dispatch<SetStateAction<Record<number, boolean>>>;
  responseExpanded: Record<number, boolean>;
  setResponseExpanded: Dispatch<SetStateAction<Record<number, boolean>>>;
  viewTabs: Record<number, "rendered" | "raw">;
  setViewTabs: Dispatch<
    SetStateAction<Record<number, "rendered" | "raw">>
  >;
  activeResultIndex: number;
  setActiveResultIndex: Dispatch<SetStateAction<number>>;
}

export interface ResultsContextValue {
  results: RunResult[];
  models: AvailableModel[];
  timestamp?: number;
  layout: ResultsLayout;
  onLayoutChange: (layout: ResultsLayout) => void;
  collapsedResults: Record<number, boolean>;
  onToggleCollapse: (index: number) => void;
  collapsedModelSettings: Record<number, boolean>;
  onToggleModelSettings: (index: number) => void;
  requestExpanded: Record<number, boolean>;
  onToggleRequest: (index: number) => void;
  responseExpanded: Record<number, boolean>;
  onToggleResponse: (index: number) => void;
  viewTabs: Record<number, "rendered" | "raw">;
  onChangeView: (index: number, view: "rendered" | "raw") => void;
  activeResultIndex: number;
  onActiveResultIndexChange: (index: number) => void;
}

const AssessmentResultsContext = createContext<ResultsContextValue | null>(null);

export function useAssessmentResultsViewState(): AssessmentResultsState {
  const [layout, setLayout] = useState<ResultsLayout>("vertical");
  const [collapsedResults, setCollapsedResults] = useState<Record<number, boolean>>({});
  const [collapsedModelSettings, setCollapsedModelSettings] =
    useState<Record<number, boolean>>({});
  const [requestExpanded, setRequestExpanded] = useState<Record<number, boolean>>({});
  const [responseExpanded, setResponseExpanded] = useState<Record<number, boolean>>({});
  const [viewTabs, setViewTabs] = useState<Record<number, "rendered" | "raw">>({});
  const [activeResultIndex, setActiveResultIndex] = useState(0);

  return {
    layout,
    setLayout,
    collapsedResults,
    setCollapsedResults,
    collapsedModelSettings,
    setCollapsedModelSettings,
    requestExpanded,
    setRequestExpanded,
    responseExpanded,
    setResponseExpanded,
    viewTabs,
    setViewTabs,
    activeResultIndex,
    setActiveResultIndex,
  };
}

export function AssessmentResultsProvider(props: {
  value: ResultsContextValue;
  children: React.ReactNode;
}) {
  const { value, children } = props;
  return (
    <AssessmentResultsContext.Provider value={value}>
      {children}
    </AssessmentResultsContext.Provider>
  );
}

export function useAssessmentResultsContext() {
  const ctx = useContext(AssessmentResultsContext);
  if (!ctx)
    throw new Error("useAssessmentResultsContext must be used within AssessmentResultsProvider");
  return ctx;
}
