import { buildDatasetDatasource, DatasetDatasource } from "../dataset";
import { buildDatasourceManual, DatasourceManual } from "./manual";

export type Datasource = Datasource.V1;

export namespace Datasource {
  export type V1 = DatasourceManual.V1 | DatasetDatasource.V1;

  export type Type = V1["type"];
}

export function buildDatasource(type: Datasource.Type): Datasource {
  switch (type) {
    case "dataset":
      return buildDatasetDatasource();

    case "manual":
      return buildDatasourceManual();
  }
}
