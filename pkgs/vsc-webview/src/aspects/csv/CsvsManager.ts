import { buildCsvRequestId, Csv, CsvMessage } from "@wrkspc/core/csv";
import { EditorFile } from "@wrkspc/core/editor";
import { always } from "alwaysly";
import { State } from "enso";
import { useAppState } from "../app/state/Context";
import { AppState } from "../app/state/state";
import { MessagesContext, useMessages } from "../message/Context";
import { useMemoWithProps } from "../util/hooks";

export namespace CsvsManager {
  export interface Props {
    csvsAppState: State<AppState.Csvs>;
    sendMessage: MessagesContext.SendMessage;
  }
}

export class CsvsManager {
  static use() {
    const { appState } = useAppState();
    const { useListen, sendMessage } = useMessages();

    const csvs = useMemoWithProps(
      { csvsAppState: appState.$.csvs, sendMessage },
      (props) => new CsvsManager(props),
      [],
    );

    useListen(
      "csv-server-select-cancel",
      (message) => csvs.#onSelectCancel(message),
      [csvs],
    );

    useListen("csv-server-data", (message) => csvs.#onData(message), [csvs]);

    return csvs;
  }

  #csvsAppState: State<AppState.Csvs>;
  #sendMessage: MessagesContext.SendMessage;

  constructor(props: CsvsManager.Props) {
    this.#csvsAppState = props.csvsAppState;
    this.#sendMessage = props.sendMessage;
  }

  requestSelect(): Csv.RequestId {
    const requestId = buildCsvRequestId();

    this.#csvsAppState.$.requests.at(requestId).set({
      id: requestId,
      status: "pending",
    });

    this.#sendMessage({
      type: "csv-client-select-request",
      payload: { requestId },
    });

    return requestId;
  }

  requestData(path: EditorFile.Path): State<Csv.Request> {
    const requestState = this.#csvsAppState.$.requests.find(
      (requestState) => requestState.value.path === path,
    );

    if (requestState) return requestState;

    const id = this.#requestData(path);

    // TODO: Make Enso's set return casted type
    return this.#csvsAppState.$.requests.at(id).set({
      id,
      status: "pending",
      path,
    }) as State<Csv.Request>;
  }

  requestState(
    requestId: Csv.RequestId | undefined,
  ): State<Csv.Request | undefined> {
    // TODO: Make Enso accept falsy values in at
    return this.#csvsAppState.$.requests.at(requestId!);
  }

  useState(path: EditorFile.Path): State<Csv> | undefined {
    const decomposed = this.#csvsAppState.$.data.at(path).useDecomposeNullish();
    if (decomposed.value) return decomposed.state;
  }

  #requestData(path: EditorFile.Path) {
    const requestId = buildCsvRequestId();

    this.#sendMessage({
      type: "csv-client-data-request",
      payload: {
        path,
        requestId,
      },
    });

    return requestId;
  }

  #onData(message: CsvMessage.ServerData) {
    switch (message.payload.status) {
      case "ok":
        return this.#onDataOk(message.payload);

      case "error":
        return this.#onDataError(message.payload);
    }
  }

  #onDataError(payload: CsvMessage.ServerDataPayloadError) {
    const requestState = this.#pendingRequestState(payload.requestId);
    requestState.set({
      id: requestState.value.id,
      status: "error",
      error: payload.error,
    });
  }

  #onDataOk(payload: CsvMessage.ServerDataPayloadOk) {
    const requestState = this.#pendingRequestState(payload.requestId);
    requestState.set({
      id: requestState.value.id,
      status: "ok",
      path: payload.data.path,
    });

    this.#csvsAppState.$.data.at(payload.data.path).set(payload.data);
  }

  #onSelectCancel(message: CsvMessage.ServerSelectCancel) {
    this.#csvsAppState.$.requests.at(message.payload.requestId).set(undefined);
  }

  #pendingRequestState(requestId: Csv.RequestId): State<Csv.Request> {
    const decomposedRequest = this.#csvsAppState.$.requests
      .at(requestId)
      .decomposeNullish();
    always(decomposedRequest.value);
    return decomposedRequest.state;
  }
}
