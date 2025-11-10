import { describe, expect, it } from "vitest";
import { DatasetDatasource } from "../dataset";
import { PlaygroundMap } from "../playground";
import { buildDatasourceId } from "./datasource";
import { datasourceInputToValues } from "./input";

describe(datasourceInputToValues, () => {
  it("merges all datasource values", () => {
    const result = datasourceInputToValues([
      {
        datasourceId: buildDatasourceId(),
        type: "dataset",
        index: 1 as DatasetDatasource.RowIndex,
        values: {
          ["greeting" as PlaygroundMap.PromptVarId]: "Hello",
        },
      },
      {
        datasourceId: buildDatasourceId(),
        type: "dataset",
        index: 1 as DatasetDatasource.RowIndex,
        values: {
          ["name" as PlaygroundMap.PromptVarId]: "Sasha",
        },
      },
    ]);
    expect(result).toEqual({
      greeting: "Hello",
      name: "Sasha",
    });
  });

  it("overwrites earlier values", () => {
    const result = datasourceInputToValues([
      {
        datasourceId: buildDatasourceId(),
        type: "dataset",
        index: 1 as DatasetDatasource.RowIndex,
        values: {
          ["greeting" as PlaygroundMap.PromptVarId]: "Hello",
          ["name" as PlaygroundMap.PromptVarId]: "Josh",
        },
      },
      {
        datasourceId: buildDatasourceId(),
        type: "dataset",
        index: 1 as DatasetDatasource.RowIndex,
        values: {
          ["name" as PlaygroundMap.PromptVarId]: "Sasha",
        },
      },
    ]);
    expect(result).toEqual({
      greeting: "Hello",
      name: "Sasha",
    });
  });
});
