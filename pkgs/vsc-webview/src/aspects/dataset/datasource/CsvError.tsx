import { State } from "enso";
import { DatasetDatasourceState } from "./state";

export namespace DatasetDatasourceCsvError {
  export interface Props {
    csvState: State<DatasetDatasourceState.CsvError>;
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
