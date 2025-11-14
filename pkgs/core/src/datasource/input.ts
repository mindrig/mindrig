import { DatasetDatasource } from "../dataset";
import { DatasourceManual } from "./manual";

export type DatasourceInput = DatasourceManual.Input | DatasetDatasource.Input;
