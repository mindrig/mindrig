import { Result } from "@wrkspc/core/result";
import { Block, textCn } from "@wrkspc/ds";
import { State } from "enso";
import { JsonPreview } from "../json/Preview";

export namespace ResultResponse {
  export interface Props {
    state: State<Result.Response> | State<Result.Response | null> | State<null>;
  }
}

export function ResultResponse(props: ResultResponse.Props) {
  const { state } = props;
  const payload = state.useCompute((response) => response?.payload, []);

  return (
    <>
      {payload ? (
        <Block background border={[false, true, true]}>
          <JsonPreview value={payload} />
        </Block>
      ) : (
        <Block border={[false, true, true]}>
          <div className={textCn({ size: "xsmall" })}>No response</div>
        </Block>
      )}
    </>
  );
}
