import { Versioned } from "../versioned";

export type Eval = Eval.V1;

export namespace Eval {
  export interface V1 extends Versioned<1> {
    // TODO: Describe eval structure here
  }
}
