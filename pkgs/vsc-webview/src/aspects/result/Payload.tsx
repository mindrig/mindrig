import { ModelType } from "@wrkspc/core/model";
import { Errors } from "@wrkspc/ds";
import { never } from "alwaysly";
import { State } from "enso";
import { ResultContentLayout } from "./ContentLayout";
import { ResultEmpty } from "./Empty";
import { ResultPayloadLanguage } from "./PayloadLanguage";

export namespace ResultPayload {
  export interface Props {
    status: PayloadStatus;
    payloadState: State<ModelType.Payload> | State<ModelType.Payload | null>;
    error: string | null;
  }

  export type PayloadStatus = "running" | "success" | "cancelled" | "errored";
}

export function ResultPayload(props: ResultPayload.Props) {
  const { status, payloadState, error } = props;
  const decomposedPayload = payloadState.useDecomposeNullish();

  if (!decomposedPayload.value) {
    return (
      <ResultContentLayout>
        {error && <Errors errors={error} />}

        {/* If the payload is empty due to an error, we don't show any message. */}
        {status !== "errored" && (
          <ResultEmpty loading={status === "running"}>
            {emptyMessage(status)}
          </ResultEmpty>
        )}
      </ResultContentLayout>
    );
  }

  switch (decomposedPayload.value.type) {
    case "language":
      return <ResultPayloadLanguage state={decomposedPayload.state} />;

    default:
      never(decomposedPayload.value.type);
  }
}

function emptyMessage(
  status: Exclude<ResultPayload.PayloadStatus, "errored">,
): string {
  switch (status) {
    case "running":
      return "Waiting for response...";

    case "success":
      return "The response is empty.";

    case "cancelled":
      return "The request was cancelled.";
  }
}
