import { ModelType } from "@wrkspc/core/model";
import { Errors, textCn } from "@wrkspc/ds";
import { never } from "alwaysly";
import { State } from "enso";
import { ResultContentLayout } from "./ContentLayout";
import { ResultPayloadLanguage } from "./PayloadLanguage";

export namespace ResultPayload {
  export interface Props {
    status: PayloadStatus;
    payloadState: State<ModelType.Payload> | State<ModelType.Payload | null>;
    error: string | null;
  }

  export type PayloadStatus = "running" | "success" | "cancelled" | "error";
}

export function ResultPayload(props: ResultPayload.Props) {
  const { status, payloadState, error } = props;
  const decomposedPayload = payloadState.useDecomposeNullish();

  if (!decomposedPayload.value) {
    return (
      <ResultContentLayout>
        {error && <Errors errors={error} />}

        {/* If the payload is empty due to an error, we don't show any message. */}
        {status !== "error" && (
          <p className={textCn({ color: "support" })}>{emptyMessage(status)}</p>
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
  status: Exclude<ResultPayload.PayloadStatus, "error">,
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
