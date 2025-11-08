import { Result } from "@wrkspc/core/result";
import { State } from "enso";
import { createContext, useContext } from "react";
import { DatasetDatasourceManager } from "./Manager";

export namespace DatasetDatasourceContext {
  export interface Value {
    datasetDatasource: DatasetDatasourceManager;
  }
}

export const DatasetDatasourceContext = createContext<
  DatasetDatasourceContext.Value | undefined
>(undefined);

export namespace DatasetDatasourceProvider {
  export interface Props {
    state: State<Result>;
  }
}

export function DatasetDatasourceProvider(
  props: React.PropsWithChildren<DatasetDatasourceContext.Value>,
) {
  return (
    <DatasetDatasourceContext.Provider value={props}>
      {props.children}
    </DatasetDatasourceContext.Provider>
  );
}

export function useDatasetDatasource(): DatasetDatasourceContext.Value {
  const value = useContext(DatasetDatasourceContext);
  if (!value)
    throw new Error(
      "useDatasetDatasource must be used within DatasetDatasourceProvider",
    );
  return value;
}
