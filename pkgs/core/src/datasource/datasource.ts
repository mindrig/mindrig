import { nanoid } from "nanoid";
import { buildDatasetDatasource, DatasetDatasource } from "../dataset";
import { PlaygroundMap } from "../playground";
import { buildDatasourceManual, DatasourceManual } from "./manual";

export type Datasource = Datasource.V1;

export namespace Datasource {
  export type Id = string & { [idBrand]: true };
  declare const idBrand: unique symbol;

  export type V1 = DatasourceManual.V1 | DatasetDatasource.V1;

  export type Type = V1["type"];

  export type ItemRef = ItemRefV1;

  export type ItemRefV1 = DatasourceManual.ItemRef | DatasetDatasource.ItemRef;

  export interface Assignment {
    item: ItemRefV1;
    values: Record<PlaygroundMap.PromptVarId, string>;
  }

  export type Values = Record<PlaygroundMap.PromptVarId, string>;
}

export function buildDatasource(type: Datasource.Type): Datasource {
  switch (type) {
    case "dataset":
      return buildDatasetDatasource();

    case "manual":
      return buildDatasourceManual();
  }
}

export function buildDatasourceId(): Datasource.Id {
  return `datasource-${nanoid()}` as Datasource.Id;
}
