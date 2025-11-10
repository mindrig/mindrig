import {
  buildDatasetSelection,
  DatasetDatasource,
  DatasetMessage,
  DatasetRequest,
  DatasetSelection,
} from "@wrkspc/core/dataset";
import { Field, State } from "enso";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MessagesContext, useMessages } from "../../message/Context";
import {
  buildDatasetDatasourceAppState,
  DatasetDatasourceAppState,
} from "./appState";

export namespace DatasetDatasourceManager {
  export interface Props {
    datasetDatasourceAppState: State<DatasetDatasourceAppState>;
    datasourceField: Field<DatasetDatasource>;
    sendMessage: MessagesContext.SendMessage;
  }

  export interface Meta {
    loading: boolean;
    loaded: boolean;
  }

  export type DiscriminatedCsv = State.Discriminated<
    DatasetDatasourceAppState.Csv | null,
    "status"
  >;

  export type UseSyncDatasetToDatasourceCallback = (
    csv: DatasetDatasourceAppState.CsvLoaded,
  ) => Field<DatasetDatasource.DataRefCsvV1>;
}

export class DatasetDatasourceManager {
  static use(datasourceField: Field<DatasetDatasource>) {
    const initialCsv = useMemo<DatasetDatasourceAppState.Csv | null>(() => {
      const value = datasourceField.$.data.value;
      if (!value) return null;
      const requestId: DatasetRequest.CsvId = nanoid();
      return { status: "loading", requestId, path: value.path };
    }, [datasourceField]);
    const datasetDatasourceAppState = State.use<DatasetDatasourceAppState>(
      buildDatasetDatasourceAppState({ csv: initialCsv }),
      [],
    );
    const { useListen, sendMessage } = useMessages();

    const datasetDatasourceManager = useMemo(
      () =>
        new DatasetDatasourceManager({
          datasetDatasourceAppState,
          datasourceField,
          sendMessage,
        }),
      [datasetDatasourceAppState, datasourceField, sendMessage],
    );

    useEffect(() => {
      if (initialCsv?.status !== "loading" || !initialCsv?.path) return;
      sendMessage({
        type: "dataset-client-csv-load-request",
        payload: {
          path: initialCsv.path,
          requestId: initialCsv.requestId,
        },
      });
    }, [initialCsv, datasetDatasourceManager]);

    useListen(
      "dataset-server-csv-select-cancel",
      (message) => datasetDatasourceManager.#onCsvSelectCancel(message),
      [datasetDatasourceManager],
    );

    useListen(
      "dataset-server-csv-data",
      (message) => datasetDatasourceManager.#onCsvContent(message),
      [datasetDatasourceManager],
    );

    return datasetDatasourceManager;
  }

  #datasetState;
  #datasourceField;
  #sendMessage;

  constructor(props: DatasetDatasourceManager.Props) {
    this.#datasetState = props.datasetDatasourceAppState;
    this.#datasourceField = props.datasourceField;
    this.#sendMessage = props.sendMessage;
  }

  loadCsv() {
    const requestId: DatasetRequest.CsvId = nanoid();

    this.#datasetState.$.csv.set({
      status: "loading",
      requestId,
    });

    this.#sendMessage({
      type: "dataset-client-csv-select-request",
      payload: { requestId },
    });
  }

  clearCsv() {
    this.#datasetState.$.csv.set(null);
  }

  useMeta(): DatasetDatasourceManager.Meta {
    const discriminatedCsv = this.#datasetState.$.csv.useDiscriminate("status");
    const meta: DatasetDatasourceManager.Meta =
      this.#datasetState.$.csv.useCompute((csv) => {
        const loading = csv?.status === "loading";
        const loaded = !!csv && !loading;
        return { loading, loaded };
      }, []);
    return meta;
  }

  useDiscriminatedCsv(): DatasetDatasourceManager.DiscriminatedCsv {
    return this.#datasetState.$.csv.useDiscriminate("status");
  }

  useSyncDatasetToDatasource(
    datasourceCsvState: State<DatasetDatasourceAppState.CsvLoaded>,
  ): Field<DatasetDatasource.DataRefCsv> {
    const syncField =
      useCallback<DatasetDatasourceManager.UseSyncDatasetToDatasourceCallback>(
        (csv) => {
          const data = this.#datasourceField.$.data.value;

          // Copy selection and mapping from existing datasource if present
          let selection: DatasetSelection;
          let mapping: DatasetDatasource.Mapping;

          if (data && data.path === csv.meta.path) {
            selection = data.selection;
            mapping = data.mapping;
          } else {
            selection = buildDatasetSelection("row");
            mapping = {};
          }

          // TODO: Make sure Enso's #set properly resolves return type here
          return this.#datasourceField.$.data.set({
            v: 1,
            type: "csv",
            path: csv.meta.path,
            selection,
            mapping,
          }) as Field<DatasetDatasource.DataRefCsv>;
        },
        [this.#datasourceField],
      );

    const [csvField, setCsvField] = useState(() =>
      syncField(datasourceCsvState.value),
    );

    // Sync on dataset state change
    datasourceCsvState.useWatch(
      (csv) => {
        setCsvField(syncField(csv));
      },
      [this.#datasourceField, setCsvField],
    );

    return csvField;
  }

  #onCsvContent(message: DatasetMessage.ServerCsvData) {
    const csv = this.#datasetState.$.csv.value;
    if (
      csv?.status !== "loading" ||
      csv.requestId !== message.payload.requestId
    )
      return;

    switch (message.payload.status) {
      case "ok":
        return this.#assignCsvOk(message.payload);

      case "error":
        return this.#assignCsvError(message.payload);
    }
  }

  #assignCsvError(payload: DatasetMessage.ServerCsvContentPayloadError) {
    this.#datasetState.$.csv.set({
      status: "error",
      error: payload.error,
    });
  }

  #assignCsvOk(payload: DatasetMessage.ServerCsvContentPayloadOk) {
    return this.#datasetState.$.csv.set({
      status: "loaded",
      meta: payload.data,
    });
  }

  async #onCsvSelectCancel(message: DatasetMessage.ServerCsvSelectCancel) {}
}
