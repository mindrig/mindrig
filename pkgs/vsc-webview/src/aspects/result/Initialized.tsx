import { Result } from "@wrkspc/core/result";
import { State } from "enso";

export namespace ResultInitialized {
  export interface Props {
    state: State<Result.ResultInitialized>;
  }
}

export function ResultInitialized(props: ResultInitialized.Props) {
  const { state } = props;

  return <div>Waiting to start...</div>;
}
