import { Eval } from "../eval/eval.js";
import { buildSetup, Setup } from "../setup/setup.js";
import { buildTest, Test } from "../test/test.js";
import { Tool } from "../tool/tool.js";
import { Versioned } from "../versioned/versioned.js";

export type Assessment = Assessment.V1;

export namespace Assessment {
  export interface V1 extends Versioned<1> {
    type: "language";
    setups: Setup[];
    tools: Tool[];
    tests: Test[];
    evals: Eval[];
  }
}

export function buildAssessment(overrides?: Partial<Assessment>): Assessment {
  return {
    v: 1,
    type: "language",
    setups: [buildSetup()],
    tools: [],
    tests: [buildTest()],
    evals: [],
    ...overrides,
  };
}
