import { Eval } from "../eval/eval.js";
import { Model } from "../model/model.js";
import { PlaygroundMap } from "../playground/map.js";
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

  export type Store = {
    [Key in `playground.assessments.${PlaygroundMap.PromptId}`]: Assessment;
  };
}

export namespace buildAssessment {
  export interface Props {
    modelsMap: Model.ModelsMap | undefined;
  }
}

export function buildAssessment(
  props: buildAssessment.Props,
  overrides?: Partial<Assessment>,
): Assessment {
  const { modelsMap } = props;

  return {
    v: 1,
    type: "language",
    setups: [buildSetup({ modelsMap })],
    tools: [],
    tests: [buildTest()],
    evals: [],
    ...overrides,
  };
}
