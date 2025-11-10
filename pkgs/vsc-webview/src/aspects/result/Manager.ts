import { State } from "enso";
import { ResultsAppState } from "./resultsAppState";

export interface ResultsManager {
  get state(): State<ResultsAppState>;
}
