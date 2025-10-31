import { Versioned } from "../versioned";

export type DatasourceManual = DatasourceManual.V1;

export namespace DatasourceManual {
  export interface V1 extends Versioned<1> {
    type: "manual";
  }
}

export function buildDatasourceManual(): DatasourceManual {
  return {
    v: 1,
    type: "manual",
  };
}
