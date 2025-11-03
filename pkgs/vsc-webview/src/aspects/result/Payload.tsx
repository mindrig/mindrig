import { ModelType } from "@wrkspc/core/model";
import { never } from "alwaysly";
import { State } from "enso";
import { ResultPayloadLanguage } from "./PayloadLanguage";

export namespace ResultPayload {
  export interface Props {
    state: State<ModelType.Payload> | State<ModelType.Payload | null>;
  }
}

export function ResultPayload(props: ResultPayload.Props) {
  const { state } = props;
  const decomposedPayload = state.useDecompose(
    (nextPayload, prevPayload) => nextPayload !== prevPayload,
    [],
  );

  if (!decomposedPayload.value) return null;

  switch (decomposedPayload.value.type) {
    case "language":
      return <ResultPayloadLanguage state={decomposedPayload.state} />;

    default:
      decomposedPayload.value.type satisfies never;
      never();
  }
}
