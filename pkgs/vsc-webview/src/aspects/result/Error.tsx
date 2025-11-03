import { Result } from "@wrkspc/core/result";
import { State } from "enso";

export namespace ResultError {
  export interface Props {
    state: State<Result.ResultError>;
  }
}

export function ResultError(props: ResultError.Props) {
  const { state } = props;
  const error = state.$.error.useValue();

  return <div>Error: {error}</div>;
}
