import { Result } from "@wrkspc/core/result";
import { Block } from "@wrkspc/ds";
import { State } from "enso";
import { JsonPreview } from "../json/Preview";
import { ResultMetaEmpty } from "./MetaEmpty";

export namespace ResultRequest {
  export interface Props {
    state: State<Result.Request> | State<Result.Request | null> | State<null>;
  }
}

export function ResultRequest(props: ResultRequest.Props) {
  const { state } = props;
  const payload = state.useCompute((response) => response?.payload, []);

  return (
    <>
      {payload ? (
        <Block background border>
          <JsonPreview value={payload} />
        </Block>
      ) : (
        <ResultMetaEmpty>No request data available.</ResultMetaEmpty>
      )}
    </>
  );
}
