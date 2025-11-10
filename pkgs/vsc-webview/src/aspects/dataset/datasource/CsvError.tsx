import { State } from "enso";
import { DatasetDatasourceAppState } from "./appState";

export namespace DatasetDatasourceCsvError {
  export interface Props {
    csvState: State<DatasetDatasourceAppState.CsvError>;
  }
}

export function DatasetDatasourceCsvError(
  props: DatasetDatasourceCsvError.Props,
) {
  const { csvState } = props;
  const error = csvState.$.error.useValue();

  return (
    <div>
      <div>Failed to load csv file:</div>
      <div>{error}</div>
    </div>
  );
}
