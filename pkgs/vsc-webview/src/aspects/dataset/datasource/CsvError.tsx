import { State } from "enso";
import { DatasetDatasourceClientState } from "./clientState";

export namespace DatasetDatasourceCsvError {
  export interface Props {
    csvState: State<DatasetDatasourceClientState.CsvError>;
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
