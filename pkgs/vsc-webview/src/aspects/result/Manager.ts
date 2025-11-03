import { State } from "enso";
import { ResultsState } from "./state";

export interface ResultsManager {
  get state(): State<ResultsState>;
}
