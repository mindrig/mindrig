import { buildSetup, Setup } from "../setup/setup.js";
import { buildTest, Test } from "../test/test.js";
import { Versioned } from "../versioned/versioned.js";

export type Assessment = Assessment.V1;

export namespace Assessment {
  export interface V1 extends Versioned<1> {
    setups: Setup[];
    tests: Test[];
  }
}

export function buildAssessment(overrides?: Partial<Assessment>): Assessment {
  return {
    v: 1,
    setups: [buildSetup()],
    tests: [buildTest()],
    ...overrides,
  };
}
