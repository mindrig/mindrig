import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DatasourceDataset } from "../Dataset";
import { DatasourceSelector } from "../Selector";
import { DatasourceVariables } from "../Variables";

describe("DatasourceVariables", () => {
  it("calls change handler with updated value", () => {
    const onVariableChange = vi.fn();

    render(
      <DatasourceVariables
        promptVariables={[{ exp: "topic" } as any]}
        variables={{ topic: "" }}
        onVariableChange={onVariableChange}
      />,
    );

    const input = screen.getByPlaceholderText("Enter value for topic");
    fireEvent.change(input, { target: { value: "AI" } });
    expect(onVariableChange).toHaveBeenCalledWith("topic", "AI");
  });
});

describe("DatasourceDataset", () => {
  it("triggers dataset callbacks in row mode", () => {
    const onLoad = vi.fn();
    const onClear = vi.fn();
    const onModeChange = vi.fn();
    const onSelectRow = vi.fn();

    render(
      <DatasourceDataset
        usingCsv
        csvFileLabel="runs.csv"
        csvRows={[["1", "hello"], ["2", "world"]]}
        headers={["id", "text"]}
        datasetMode="row"
        selectedRowIdx={null}
        rangeStart=""
        rangeEnd=""
        onDatasetModeChange={onModeChange}
        onSelectRow={onSelectRow}
        onRangeStartChange={vi.fn()}
        onRangeEndChange={vi.fn()}
        onLoadCsv={onLoad}
        onClearCsv={onClear}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Reload CSV" }));
    expect(onLoad).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Clear CSV" }));
    expect(onClear).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText("Enter CSV range"));
    expect(onModeChange).toHaveBeenCalledWith("range");

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "1" },
    });
    expect(onSelectRow).toHaveBeenCalledWith(1);
  });

  it("updates range inputs when in range mode", () => {
    const onModeChange = vi.fn();
    const onRangeStart = vi.fn();
    const onRangeEnd = vi.fn();

    render(
      <DatasourceDataset
        usingCsv
        csvFileLabel="runs.csv"
        csvRows={[["1"], ["2"]]}
        headers={null}
        datasetMode="range"
        selectedRowIdx={null}
        rangeStart="1"
        rangeEnd="2"
        onDatasetModeChange={onModeChange}
        onSelectRow={vi.fn()}
        onRangeStartChange={onRangeStart}
        onRangeEndChange={onRangeEnd}
        onLoadCsv={vi.fn()}
        onClearCsv={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Start (1)"), {
      target: { value: "3" },
    });
    expect(onRangeStart).toHaveBeenCalledWith("3");

    fireEvent.change(screen.getByPlaceholderText("End (2)"), {
      target: { value: "4" },
    });
    expect(onRangeEnd).toHaveBeenCalledWith("4");

    fireEvent.click(screen.getByLabelText("Select row"));
    expect(onModeChange).toHaveBeenCalledWith("row");
  });

  it("shows helper message when CSV absent", () => {
    render(
      <DatasourceDataset
        usingCsv={false}
        csvFileLabel={null}
        csvRows={[]}
        headers={null}
        datasetMode="row"
        selectedRowIdx={null}
        rangeStart=""
        rangeEnd=""
        onDatasetModeChange={vi.fn()}
        onSelectRow={vi.fn()}
        onRangeStartChange={vi.fn()}
        onRangeEndChange={vi.fn()}
        onLoadCsv={vi.fn()}
        onClearCsv={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Load a CSV to enable dataset options."),
    ).toBeInTheDocument();
  });
});

describe("DatasourceSelector", () => {
  it("notifies when input source toggles", () => {
    const onInputSourceChange = vi.fn();

    render(
      <DatasourceSelector
        inputSource="manual"
        promptVariables={[]}
        variables={{}}
        datasetMode="row"
        csvRows={[]}
        csvHeader={null}
        csvFileLabel={null}
        selectedRowIdx={null}
        rangeStart=""
        rangeEnd=""
        usingCsv={false}
        onInputSourceChange={onInputSourceChange}
        onVariableChange={vi.fn()}
        onDatasetModeChange={vi.fn()}
        onSelectRow={vi.fn()}
        onRangeStartChange={vi.fn()}
        onRangeEndChange={vi.fn()}
        onLoadCsv={vi.fn()}
        onClearCsv={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("Use dataset"));
    expect(onInputSourceChange).toHaveBeenCalledWith("dataset");
  });
});
