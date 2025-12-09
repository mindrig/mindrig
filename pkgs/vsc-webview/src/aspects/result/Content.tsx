import { Result } from "@wrkspc/core/result";
import { State } from "enso";
import { ResultInitialized } from "./Initialized";
import { ResultPayload } from "./Payload";

export namespace ResultContent {
  export interface Props {
    resultState: State<Result>;
  }
}

export function ResultContent(props: ResultContent.Props) {
  const { resultState } = props;
  const discriminatedResult = resultState.useDiscriminate("status");
  const error = resultState.useCompute(
    (result) => ("error" in result && result.error) || null,
    [],
  );

  switch (discriminatedResult.discriminator) {
    case "initialized":
      // TODO: Style it properly.
      return <ResultInitialized state={discriminatedResult.state} />;

    case "running":
    case "success":
    case "cancelled":
    case "errored":
      return (
        <ResultPayload
          status={discriminatedResult.discriminator}
          payloadState={discriminatedResult.state.$.payload}
          error={error}
        />
      );
  }
}
