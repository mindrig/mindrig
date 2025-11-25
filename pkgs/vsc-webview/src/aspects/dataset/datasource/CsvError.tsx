import { State } from "enso";

export namespace DatasetDatasourceCsvError {
  export interface Props {
    errorState: State<string>;
  }
}

export function DatasetDatasourceCsvError(
  props: DatasetDatasourceCsvError.Props,
) {
  const { errorState } = props;
  const error = errorState.useValue();

  return (
    <div>
      <div>Failed to load csv file:</div>
      <div>{error}</div>
    </div>
  );
}
