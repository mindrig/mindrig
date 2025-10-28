import { AssessmentDatasourceProvider } from "@/aspects/assessment/hooks/useAssessmentDatasource";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
// import {
//   createDatasourceContextValue,
// } from "@/testUtils/assessment";
import { DatasourceDataset } from "../Dataset";
import { DatasourceSelector } from "../Selector";
import { DatasourceVariables } from "../Variables";

describe.skip("DatasourceVariables", () => {
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

describe.skip("DatasourceDataset", () => {
  it("triggers dataset callbacks in row mode", () => {
    const onLoad = vi.fn();
    const onClear = vi.fn();
    const onModeChange = vi.fn();
    const onSelectRow = vi.fn();

    render(
      <DatasourceDataset
        usingCsv
        csvFileLabel="runs.csv"
        csvRows={[
          ["1", "hello"],
          ["2", "world"],
        ]}
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

  it("summarises run count when all rows selected", () => {
    render(
      <DatasourceDataset
        usingCsv
        csvFileLabel="runs.csv"
        csvRows={[["1"], ["2"], ["3"]]}
        headers={null}
        datasetMode="all"
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

    expect(screen.getByText("All rows will run (3).")).toBeInTheDocument();
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

describe.skip("DatasourceSelector", () => {
  it("notifies when input source toggles", () => {
    const setInputSource = vi.fn();
    const value = createDatasourceContextValue({
      inputSource: "manual",
      setInputSource,
    });

    render(
      <AssessmentDatasourceProvider value={value}>
        <DatasourceSelector />
      </AssessmentDatasourceProvider>,
    );

    fireEvent.click(screen.getByLabelText("Use dataset"));
    expect(setInputSource).toHaveBeenCalledWith("dataset");
  });
});
