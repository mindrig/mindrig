import type { Prompt, PromptVar } from "@mindrig/types";
import { Datasource } from "../datasource";
import { PromptArguments, substituteVariables } from "../prompt";
import { PromptRun } from "../promptRun";
import { DatasetSelection } from "./selection.js";

export * from "./content.js";
export * from "./request.js";
export * from "./selection.js";

export function computeVariablesFromRow(
  row: string[],
  headers: string[] | null,
  promptVars: PromptVar[] | undefined,
): Record<string, string> {
  if (!promptVars || promptVars.length === 0)
    return {} as Record<string, string>;
  const next: Record<string, string> = {};
  if (headers) {
    for (const variable of promptVars) {
      const idx = headers.indexOf(variable.exp);
      if (idx !== -1) next[variable.exp] = row[idx] ?? "";
    }
  }
  if (Object.keys(next).length < (promptVars?.length ?? 0)) {
    promptVars.forEach((v, i) => {
      if (!next[v.exp]) next[v.exp] = row[i] ?? "";
    });
  }
  return next;
}

export function buildRunsAndSettings(args: {
  inputSource: Datasource.Type;
  datasetMode: DatasetSelection.Type;
  csvRows: string[][];
  selectedRowIdx: number | null;
  rangeStart: string | number;
  rangeEnd: string | number;
  promptText: string;
  variables: PromptArguments;
  prompt: Prompt;
  headers: string[] | null;
}): {
  runs: Array<PromptRun.Info>;
  runSettings: Datasource;
} {
  const runs: Array<PromptRun.Info> = [];

  if (args.inputSource === "manual") {
    runs.push({
      label: "Manual",
      variables: args.variables,
      substitutedPrompt: substituteVariables(
        args.promptText,
        args.prompt,
        args.variables,
      ),
    });
  } else {
    const { csvRows, datasetMode, selectedRowIdx, rangeStart, rangeEnd } = args;
    if (datasetMode === "row") {
      const idx = selectedRowIdx ?? 0;
      const row = csvRows[idx]!;
      const vars = computeVariablesFromRow(row, args.headers, args.prompt.vars);
      runs.push({
        label: `Row ${idx + 1}`,
        variables: vars,
        substitutedPrompt: substituteVariables(
          args.promptText,
          args.prompt,
          vars,
        ),
      });
    } else if (datasetMode === "range") {
      const start = Math.max(1, Number(rangeStart));
      const end = Math.min(csvRows.length, Number(rangeEnd));
      for (let i = start - 1; i <= end - 1; i++) {
        const row = csvRows[i]!;
        const vars = computeVariablesFromRow(
          row,
          args.headers,
          args.prompt.vars,
        );
        runs.push({
          label: `Row ${i + 1}`,
          variables: vars,
          substitutedPrompt: substituteVariables(
            args.promptText,
            args.prompt,
            vars,
          ),
        });
      }
    } else if (datasetMode === "all") {
      for (let i = 0; i < csvRows.length; i++) {
        const row = csvRows[i]!;
        const vars = computeVariablesFromRow(
          row,
          args.headers,
          args.prompt.vars,
        );
        runs.push({
          label: `Row ${i + 1}`,
          variables: vars,
          substitutedPrompt: substituteVariables(
            args.promptText,
            args.prompt,
            vars,
          ),
        });
      }
    }
  }

  const runSettings: {
    source: Datasource.Type;
    datasetMode: DatasetSelection.Type;
    selectedRowIdx: number | null;
    range?: { start: number; end: number };
    totalRows: number;
  } = {
    source: args.inputSource,
    datasetMode: args.datasetMode,
    selectedRowIdx: args.selectedRowIdx,
    totalRows: args.csvRows.length,
  };

  if (args.datasetMode === "range") {
    runSettings.range = {
      start: (Number(args.rangeStart) || 1) as number,
      end: (Number(args.rangeEnd) || args.csvRows.length) as number,
    };
  }

  return { runs, runSettings };
}
