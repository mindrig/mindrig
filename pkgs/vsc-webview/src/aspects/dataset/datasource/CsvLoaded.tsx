import { useCsvs } from "@/aspects/csv/CsvsContext";
import { EditorFile } from "@wrkspc/core/editor";
import { State } from "enso";
import { DatasetDatasourceCsvData } from "./CsvData";

export namespace DatasetDatasourceCsvLoaded {
  export interface Props {
    pathState: State<EditorFile.Path>;
  }
}

export function DatasetDatasourceCsvLoaded(
  props: DatasetDatasourceCsvLoaded.Props,
) {
  const { pathState } = props;
  const { csvs } = useCsvs();
  const path = pathState.useValue();
  const csvState = csvs.useState(path);

  if (!csvState) return null;

  return <DatasetDatasourceCsvData csvState={csvState} />;
}
