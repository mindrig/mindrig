import { Attachment } from "../attachment";
import { Datasource } from "../datasource";
import { Versioned } from "../versioned";

export type Test = Test.V1;

export namespace Test {
  export interface V1 extends Versioned<1> {
    attachments: Attachment[];
    datasources: Datasource[];
    // runIds: Run.Id[];
  }
}

export function buildTest(overrides?: Partial<Test>): Test {
  return {
    v: 1,
    attachments: [],
    datasources: [],
    ...overrides,
  };
}
