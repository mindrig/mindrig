import { Versioned } from "../versioned";

export type DatasetSelection = DatasetSelection.V1;

export namespace DatasetSelection {
  export type V1 = RowV1 | RangeV1 | AllV1;

  export type Type = DatasetSelection["type"];

  export type Row = RowV1;

  export interface RowV1 extends Versioned<1> {
    type: "row";
    index: number | null;
  }

  export type Range = RangeV1;

  export interface RangeV1 extends Versioned<1> {
    type: "range";
    span: RangeSpanV1 | null;
  }

  export interface RangeSpanV1 extends Versioned<1> {
    start: number;
    end: number;
  }

  export type All = AllV1;

  export interface AllV1 extends Versioned<1> {
    type: "all";
  }
}

export function buildDatasetSelection(
  type: DatasetSelection.Type,
): DatasetSelection {
  switch (type) {
    case "row":
      return buildDatasetSelectionRow();
    case "range":
      return buildDatasetSelectionRange();
    case "all":
      return buildDatasetSelectionAll();
  }
}

export function buildDatasetSelectionRow(): DatasetSelection {
  return {
    v: 1,
    type: "row",
    index: null,
  };
}

export function buildDatasetSelectionRange(): DatasetSelection {
  return {
    v: 1,
    type: "range",
    span: null,
  };
}

export function buildDatasetSelectionAll(): DatasetSelection {
  return {
    v: 1,
    type: "all",
  };
}
