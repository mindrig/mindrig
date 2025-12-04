import { Result } from "@wrkspc/core/result";
import { Block, textCn } from "@wrkspc/ds";
import { State } from "enso";
import { JsonPreview } from "../json/Preview";

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
        <Block background border={[false, true, true]}>
          <JsonPreview value={payload} />
        </Block>
      ) : (
        <Block background border={[false, true, true]}>
          <p className={textCn({ size: "small" })}>No request</p>
        </Block>
      )}
    </>
  );
}
