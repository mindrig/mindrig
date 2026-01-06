import { useAppState } from "@/aspects/app/state/Context";
import { useBlueprint } from "@/aspects/blueprint/Context";
import { useCsvs } from "@/aspects/csv/CsvsContext";
import { CsvsManager } from "@/aspects/csv/CsvsManager";
import { useMemoWithProps } from "@/aspects/util/hooks";
import { Csv } from "@wrkspc/core/csv";
import {
  buildDatasetSelection,
  DatasetDatasource,
  DatasetSelection,
} from "@wrkspc/core/dataset";
import {
  getPlaygroundMapVarExp,
  PlaygroundMap,
  PlaygroundState,
} from "@wrkspc/core/playground";
import { Field, State } from "enso";
import { useCallback, useEffect, useState } from "react";
import {
  buildDatasetDatasourceAppState,
  DatasetDatasourceAppState,
} from "./appState";

export namespace DatasetDatasourceManager {
  export interface Props {
    datasetDatasourceAppState: State<DatasetDatasourceAppState>;
    datasourceField: Field<DatasetDatasource>;
    promptState: State<PlaygroundState.Prompt>;
    csvs: CsvsManager;
  }

  export interface Meta {
    pending: boolean;
    resolved: boolean;
  }

  export type UseSyncDatasetToDatasourceCallback = (
    csv: Csv,
  ) => Field<DatasetDatasource.DataRefCsvV1>;
}

export class DatasetDatasourceManager {
  static use(datasourceField: Field<DatasetDatasource>) {
    const { appState } = useAppState();
    const { csvs } = useCsvs();
    const { promptState } = useBlueprint();

    const datasourceId = datasourceField.$.id.useValue();
    const datasetDatasourceAppState = appState.$.datasetDatasources
      .at(datasourceId)
      .pave(buildDatasetDatasourceAppState());

    const path = datasourceField.$.data.useCompute((data) => data?.path, []);

    useEffect(() => {
      if (!path) return;
      csvs.requestData(path);
    }, [csvs, path]);

    const datasetDatasource = useMemoWithProps(
      { datasetDatasourceAppState, datasourceField, promptState, csvs },
      (props) => new DatasetDatasourceManager(props),
      [],
    );

    return datasetDatasource;
  }

  #datasetDatasourceAppState: State<DatasetDatasourceAppState>;
  #datasourceField: Field<DatasetDatasource>;
  #promptState: State<PlaygroundState.Prompt>;
  #csvs: CsvsManager;

  constructor(props: DatasetDatasourceManager.Props) {
    this.#datasetDatasourceAppState = props.datasetDatasourceAppState;
    this.#datasourceField = props.datasourceField;
    this.#promptState = props.promptState;
    this.#csvs = props.csvs;
  }

  useCsvRequestState(): State<Csv.Request | undefined> {
    const requestId = this.#datasetDatasourceAppState.$.requestId.useValue();
    return this.#csvs.requestState(requestId!);
  }

  selectCsv() {
    const requestId = this.#csvs.requestSelect();
    this.#datasetDatasourceAppState.$.requestId.set(requestId);
  }

  clearCsv() {
    this.#datasourceField.$.data.set(null);
    this.#datasetDatasourceAppState.$.requestId.set(undefined);
  }

  useMeta(): DatasetDatasourceManager.Meta {
    const requestState = this.useCsvRequestState();

    return requestState.useCompute((request) => {
      const pending = request?.status === "pending";
      const resolved = !!request && !pending;
      return { pending, resolved };
    }, []);
  }

  useSyncCsvDataToDatasource(
    csvState: State<Csv>,
  ): Field<DatasetDatasource.DataRefCsv> {
    const csvToField =
      useCallback<DatasetDatasourceManager.UseSyncDatasetToDatasourceCallback>(
        (csv) => {
          const data = this.#datasourceField.$.data.value;

          // Copy selection and mapping from existing datasource if present
          let selection: DatasetSelection;
          let mapping: DatasetDatasource.CsvMapping;

          if (data && data.path === csv.path) {
            selection = data.selection;
            mapping = data.mapping;
          } else {
            selection = buildDatasetSelection("row");
            mapping = this.#buildMapping(csv);
          }

          // TODO: Make sure Enso's #set properly resolves return type here
          return this.#datasourceField.$.data.set({
            v: 1,
            type: "csv",
            path: csv.path,
            selection,
            mapping,
          }) as Field<DatasetDatasource.DataRefCsv>;
        },
        [this.#datasourceField],
      );

    const [csvField, setCsvField] = useState(() => csvToField(csvState.value));

    // Sync on dataset state change
    csvState.useWatch(
      (csv) => {
        setCsvField(csvToField(csv));
      },
      [this.#datasourceField, setCsvField, csvToField],
    );

    return csvField;
  }

  #buildMapping(csv: Csv) {
    const mapping: DatasetDatasource.CsvMapping = {};
    const vars = this.#promptState.$.prompt.$.vars.value;

    const varsMap: Record<string, PlaygroundMap.PromptVarId> = {};
    vars.forEach((var_) => {
      const exp = getPlaygroundMapVarExp(var_);
      varsMap[exp] = var_.id;
    });

    csv.header.forEach((columnName, index) => {
      const varId = varsMap[columnName.trim().toLowerCase()];
      if (!varId) return;
      mapping[varId] = index as Csv.ColumnIndex;
    });

    return mapping;
  }
}
