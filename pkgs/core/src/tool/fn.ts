import { Versioned } from "../versioned";

export type ToolFn = ToolFn.V1;

export namespace ToolFn {
  export interface V1 extends Versioned<1> {
    // TODO: Type JSON
    json: string;
  }
}
