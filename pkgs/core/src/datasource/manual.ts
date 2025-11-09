import { PlaygroundMap } from "../playground";
import { Versioned } from "../versioned";
import { buildDatasourceId, Datasource } from "./datasource";

export type DatasourceManual = DatasourceManual.V1;

export namespace DatasourceManual {
  export interface V1 extends Versioned<1> {
    type: "manual";
    id: Datasource.Id;
    values: Values;
  }

  export type Values = Record<PlaygroundMap.PromptVarId, string>;

  export type ItemRef = ItemRefV1;

  export interface ItemRefV1 extends Versioned<1> {
    type: "manual";
  }
}

export function buildDatasourceManual(): DatasourceManual {
  return {
    v: 1,
    type: "manual",
    id: buildDatasourceId(),
    values: {},
  };
}
