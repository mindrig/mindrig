import { Result } from "@wrkspc/core/result";
import { State } from "enso";
import { ResultError } from "./Error";
import { ResultInitialized } from "./Initialized";
import { ResultPayload } from "./Payload";

export namespace ResultContent {
  export interface Props {
    state: State<Result>;
  }
}

export function ResultContent(props: ResultContent.Props) {
  const { state } = props;
  const discriminatedResult = state.useDiscriminate("status");

  switch (discriminatedResult.discriminator) {
    case "initialized":
      return <ResultInitialized state={discriminatedResult.state} />;

    case "error":
      return <ResultError state={discriminatedResult.state} />;

    case "running":
    case "success":
      return <ResultPayload state={discriminatedResult.state.$.payload} />;
  }
}
