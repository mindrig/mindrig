import { ModelType } from "@wrkspc/core/model";
import { textCn } from "@wrkspc/ds";
import { never } from "alwaysly";
import { State } from "enso";
import { ResultContentLayout } from "./ContentLayout";
import { ResultPayloadLanguage } from "./PayloadLanguage";

export namespace ResultPayload {
  export interface Props {
    status: PayloadStatus;
    state: State<ModelType.Payload> | State<ModelType.Payload | null>;
  }

  export type PayloadStatus = "running" | "success" | "cancelled";
}

export function ResultPayload(props: ResultPayload.Props) {
  const { status, state } = props;
  const decomposedPayload = state.useDecomposeNullish();

  if (!decomposedPayload.value)
    return (
      <ResultContentLayout>
        <p className={textCn({ color: "support" })}>{emptyMessage(status)}</p>
      </ResultContentLayout>
    );

  switch (decomposedPayload.value.type) {
    case "language":
      return <ResultPayloadLanguage state={decomposedPayload.state} />;

    default:
      never(decomposedPayload.value.type);
  }
}

function emptyMessage(status: ResultPayload.PayloadStatus): string {
  switch (status) {
    case "running":
      return "Waiting for response...";

    case "success":
      return "The response is empty.";

    case "cancelled":
      return "The request was cancelled.";
  }
}
