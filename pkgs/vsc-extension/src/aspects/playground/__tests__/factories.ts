import { EditorFile, editorFileToMeta } from "@wrkspc/core/editor";
import {
  buildMapFileId,
  buildMapPromptId,
  buildMapPromptVarId,
  PlaygroundMap,
  toPlaygroundMapPrompt,
} from "@wrkspc/core/playground";
import { sliceSpan } from "@wrkspc/core/prompt";
import { nanoid } from "nanoid";
import {
  ParseResultSuccess,
  Prompt,
  PromptContentToken,
  PromptVar,
  Span,
  SpanShape,
} from "volumen";
import { ResolvePlaygroundState } from "../resolve";

export const DEFAULT_TIMESTAMP = 1_700_000_000_000;
export const DEFAULT_FILE_PATH_NEW = "/new.ts" as EditorFile.Path;
export const DEFAULT_FILE_PATH_OLD = "/old.ts" as EditorFile.Path;
export const DEFAULT_PROMPT = "Say hello to {{name}}";
export const DEFAULT_PROMPT_START = 50;
export const LEGACY_DEFAULT_SPAN: LegacySpan = {
  start: DEFAULT_PROMPT_START,
  end: DEFAULT_PROMPT_START + DEFAULT_PROMPT.length,
};

//#region Editor ###############################################################

export function editorFilePathFactory(
  path?: string | undefined,
): EditorFile.Path {
  return (path || `/file-${nanoid()}.ts`) as EditorFile.Path;
}

export function editorFileFactory(overrides?: Partial<EditorFile>): EditorFile {
  return {
    content: "",
    ...editorFileMetaFactory(overrides),
    ...overrides,
  };
}

export function editorFileMetaFactory(
  overrides?: Partial<EditorFile.Meta>,
): EditorFile.Meta {
  return {
    v: 1,
    path: editorFilePathFactory(),
    isDirty: false,
    languageId: "ts",
    ...overrides,
  };
}

export function editorCursorFactory(
  overrides?: Partial<EditorFile.Cursor>,
): EditorFile.Cursor {
  return {
    offset: 0,
    line: 0,
    character: 0,
    ...overrides,
  };
}

//#endregion

//#region Parser ###############################################################

//#region Volumen --------------------------------------------------------------

export const TEST_FILE_A_SOURCE = `const one = 1;
const two = 2;
const alphaPrompt = \`alpha: \${one}\`;
const betaPrompt = \`beta: \${two}, \${one}\`;
`;

export const TEST_FILE_A_PARSED_RESULT = {
  state: "success",
  prompts: [
    {
      file: "testA.ts",
      enclosure: [30, 66],
      span: {
        outer: [50, 65],
        inner: [51, 64],
      },
      content: [
        {
          type: "str",
          span: [51, 58],
        },
        {
          type: "var",
          span: [58, 64],
          index: 0,
        },
      ],
      joint: {
        outer: [0, 0],
        inner: [0, 0],
      },
      vars: [
        {
          span: {
            outer: [58, 64],
            inner: [60, 63],
          },
        },
      ],
      annotations: [],
    },
    {
      file: "testA.ts",
      enclosure: [67, 109],
      span: {
        outer: [86, 108],
        inner: [87, 107],
      },
      content: [
        {
          type: "str",
          span: [87, 93],
        },
        {
          type: "var",
          span: [93, 99],
          index: 0,
        },
        {
          type: "str",
          span: [99, 101],
        },
        {
          type: "var",
          span: [101, 107],
          index: 1,
        },
      ],
      joint: {
        outer: [0, 0],
        inner: [0, 0],
      },
      vars: [
        {
          span: {
            outer: [93, 99],
            inner: [95, 98],
          },
        },
        {
          span: {
            outer: [101, 107],
            inner: [103, 106],
          },
        },
      ],
      annotations: [],
    },
  ] as const,
} satisfies ParseResultSuccess;

export const TEST_FILE_B_SOURCE = `const three = 3;
const four = 4;
const gammaPrompt = \`gamma: \${three}, \${four}\`;
`;

export const TEST_FILE_B_PARSED_RESULT = {
  state: "success",
  prompts: [
    {
      file: "testFileB.ts",
      enclosure: [33, 80] as const,
      span: {
        outer: [53, 79] as const,
        inner: [54, 78] as const,
      },
      content: [
        {
          type: "str",
          span: [54, 61] as const,
        },
        {
          type: "var",
          span: [61, 69] as const,
          index: 0,
        },
        {
          type: "str",
          span: [69, 71] as const,
        },
        {
          type: "var",
          span: [71, 78] as const,
          index: 1,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [61, 69] as const,
            inner: [63, 68] as const,
          },
        },
        {
          span: {
            outer: [71, 78] as const,
            inner: [73, 77] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
  ] as const,
} satisfies ParseResultSuccess;

export const TEST_FILE_C_SOURCE = `const five = 5;
const fivish = "5";
const phiveesh = "5";
const six = 6;
const sixy = "6";
const seven = 7;
const sevn = "7";
const svnth = "7";
const eight = 8;
const okto = "8";
const deltaPrompt = \`delta: \${five}, \${six}, \${seven}\`; // 0
const epsilonPrompt = \`epsilon: \${seven}, \${five}, \${eight}\`; // 1 - matches delta 0 and 2 vars by content
const zetaPrompt = \`zeta: \${five}, \${five}, \${five}\`; // 2 - repeats delta 0 var content exactly
const etaPrompt = \`eta: \${five}, \${six}, \${seven}\`; // 3 - matches delta vars exactly
const thetaPrompt = \`theta: \${sevn}, \${fivish}, \${okto}\`; // 4 - matches delta 0 and 2 vars by distance
const iotaPrompt = \`iota: \${svnth}, \${phiveesh}, \${okto}\`; // 5 - doesn't pass distance threshold to match delta vars
const kappaPrompt = \`kappa: \${fivish}, \${fivish}, \${fivish}\`; // 6 - repeats delta 0 var content by distance
const lambdaPrompt = \`lambda: \${eight}, \${five}, \${six}, \${sevn}\`; // 7 - matches delta 1 and 2 by content and 3 by distance and prepends new 0 var
const muPrompt = \`mu: \${five}, \${six}, \${seven}, \${five}\`; // 8 - matches delta vars and appends one 0 repeat
const nuPrompt = \`delta: \${five}, \${six}, \${seven}\`; // 9 - matches delta prompt
const xiPrompt = \`epsilon: \${seven}, \${five}, \${eight}\`; // 10 - matches epsilon prompt
// ...omicron, pi, rho, sigma, tau, upsilon, phi, chi, psi, omega
`;

export const TEST_FILE_C_PARSED_RESULT = {
  state: "success",
  prompts: [
    {
      file: "testFileC.ts",
      enclosure: [180, 235] as const,
      span: {
        outer: [200, 234] as const,
        inner: [201, 233] as const,
      },
      content: [
        {
          type: "str",
          span: [201, 208] as const,
        },
        {
          type: "var",
          span: [208, 215] as const,
          index: 0,
        },
        {
          type: "str",
          span: [215, 217] as const,
        },
        {
          type: "var",
          span: [217, 223] as const,
          index: 1,
        },
        {
          type: "str",
          span: [223, 225] as const,
        },
        {
          type: "var",
          span: [225, 233] as const,
          index: 2,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [208, 215] as const,
            inner: [210, 214] as const,
          },
        },
        {
          span: {
            outer: [217, 223] as const,
            inner: [219, 222] as const,
          },
        },
        {
          span: {
            outer: [225, 233] as const,
            inner: [227, 232] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
    {
      file: "testFileC.ts",
      enclosure: [241, 302] as const,
      span: {
        outer: [263, 301] as const,
        inner: [264, 300] as const,
      },
      content: [
        {
          type: "str",
          span: [264, 273] as const,
        },
        {
          type: "var",
          span: [273, 281] as const,
          index: 0,
        },
        {
          type: "str",
          span: [281, 283] as const,
        },
        {
          type: "var",
          span: [283, 290] as const,
          index: 1,
        },
        {
          type: "str",
          span: [290, 292] as const,
        },
        {
          type: "var",
          span: [292, 300] as const,
          index: 2,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [273, 281] as const,
            inner: [275, 280] as const,
          },
        },
        {
          span: {
            outer: [283, 290] as const,
            inner: [285, 289] as const,
          },
        },
        {
          span: {
            outer: [292, 300] as const,
            inner: [294, 299] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
    {
      file: "testFileC.ts",
      enclosure: [348, 401] as const,
      span: {
        outer: [367, 400] as const,
        inner: [368, 399] as const,
      },
      content: [
        {
          type: "str",
          span: [368, 374] as const,
        },
        {
          type: "var",
          span: [374, 381] as const,
          index: 0,
        },
        {
          type: "str",
          span: [381, 383] as const,
        },
        {
          type: "var",
          span: [383, 390] as const,
          index: 1,
        },
        {
          type: "str",
          span: [390, 392] as const,
        },
        {
          type: "var",
          span: [392, 399] as const,
          index: 2,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [374, 381] as const,
            inner: [376, 380] as const,
          },
        },
        {
          span: {
            outer: [383, 390] as const,
            inner: [385, 389] as const,
          },
        },
        {
          span: {
            outer: [392, 399] as const,
            inner: [394, 398] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
    {
      file: "testFileC.ts",
      enclosure: [445, 496] as const,
      span: {
        outer: [463, 495] as const,
        inner: [464, 494] as const,
      },
      content: [
        {
          type: "str",
          span: [464, 469] as const,
        },
        {
          type: "var",
          span: [469, 476] as const,
          index: 0,
        },
        {
          type: "str",
          span: [476, 478] as const,
        },
        {
          type: "var",
          span: [478, 484] as const,
          index: 1,
        },
        {
          type: "str",
          span: [484, 486] as const,
        },
        {
          type: "var",
          span: [486, 494] as const,
          index: 2,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [469, 476] as const,
            inner: [471, 475] as const,
          },
        },
        {
          span: {
            outer: [478, 484] as const,
            inner: [480, 483] as const,
          },
        },
        {
          span: {
            outer: [486, 494] as const,
            inner: [488, 493] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
    {
      file: "testFileC.ts",
      enclosure: [531, 588] as const,
      span: {
        outer: [551, 587] as const,
        inner: [552, 586] as const,
      },
      content: [
        {
          type: "str",
          span: [552, 559] as const,
        },
        {
          type: "var",
          span: [559, 566] as const,
          index: 0,
        },
        {
          type: "str",
          span: [566, 568] as const,
        },
        {
          type: "var",
          span: [568, 577] as const,
          index: 1,
        },
        {
          type: "str",
          span: [577, 579] as const,
        },
        {
          type: "var",
          span: [579, 586] as const,
          index: 2,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [559, 566] as const,
            inner: [561, 565] as const,
          },
        },
        {
          span: {
            outer: [568, 577] as const,
            inner: [570, 576] as const,
          },
        },
        {
          span: {
            outer: [579, 586] as const,
            inner: [581, 585] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
    {
      file: "testFileC.ts",
      enclosure: [635, 693] as const,
      span: {
        outer: [654, 692] as const,
        inner: [655, 691] as const,
      },
      content: [
        {
          type: "str",
          span: [655, 661] as const,
        },
        {
          type: "var",
          span: [661, 669] as const,
          index: 0,
        },
        {
          type: "str",
          span: [669, 671] as const,
        },
        {
          type: "var",
          span: [671, 682] as const,
          index: 1,
        },
        {
          type: "str",
          span: [682, 684] as const,
        },
        {
          type: "var",
          span: [684, 691] as const,
          index: 2,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [661, 669] as const,
            inner: [663, 668] as const,
          },
        },
        {
          span: {
            outer: [671, 682] as const,
            inner: [673, 681] as const,
          },
        },
        {
          span: {
            outer: [684, 691] as const,
            inner: [686, 690] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
    {
      file: "testFileC.ts",
      enclosure: [753, 814] as const,
      span: {
        outer: [773, 813] as const,
        inner: [774, 812] as const,
      },
      content: [
        {
          type: "str",
          span: [774, 781] as const,
        },
        {
          type: "var",
          span: [781, 790] as const,
          index: 0,
        },
        {
          type: "str",
          span: [790, 792] as const,
        },
        {
          type: "var",
          span: [792, 801] as const,
          index: 1,
        },
        {
          type: "str",
          span: [801, 803] as const,
        },
        {
          type: "var",
          span: [803, 812] as const,
          index: 2,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [781, 790] as const,
            inner: [783, 789] as const,
          },
        },
        {
          span: {
            outer: [792, 801] as const,
            inner: [794, 800] as const,
          },
        },
        {
          span: {
            outer: [803, 812] as const,
            inner: [805, 811] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
    {
      file: "testFileC.ts",
      enclosure: [862, 928] as const,
      span: {
        outer: [883, 927] as const,
        inner: [884, 926] as const,
      },
      content: [
        {
          type: "str",
          span: [884, 892] as const,
        },
        {
          type: "var",
          span: [892, 900] as const,
          index: 0,
        },
        {
          type: "str",
          span: [900, 902] as const,
        },
        {
          type: "var",
          span: [902, 909] as const,
          index: 1,
        },
        {
          type: "str",
          span: [909, 911] as const,
        },
        {
          type: "var",
          span: [911, 917] as const,
          index: 2,
        },
        {
          type: "str",
          span: [917, 919] as const,
        },
        {
          type: "var",
          span: [919, 926] as const,
          index: 3,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [892, 900] as const,
            inner: [894, 899] as const,
          },
        },
        {
          span: {
            outer: [902, 909] as const,
            inner: [904, 908] as const,
          },
        },
        {
          span: {
            outer: [911, 917] as const,
            inner: [913, 916] as const,
          },
        },
        {
          span: {
            outer: [919, 926] as const,
            inner: [921, 925] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
    {
      file: "testFileC.ts",
      enclosure: [1010, 1068] as const,
      span: {
        outer: [1027, 1067] as const,
        inner: [1028, 1066] as const,
      },
      content: [
        {
          type: "str",
          span: [1028, 1032] as const,
        },
        {
          type: "var",
          span: [1032, 1039] as const,
          index: 0,
        },
        {
          type: "str",
          span: [1039, 1041] as const,
        },
        {
          type: "var",
          span: [1041, 1047] as const,
          index: 1,
        },
        {
          type: "str",
          span: [1047, 1049] as const,
        },
        {
          type: "var",
          span: [1049, 1057] as const,
          index: 2,
        },
        {
          type: "str",
          span: [1057, 1059] as const,
        },
        {
          type: "var",
          span: [1059, 1066] as const,
          index: 3,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [1032, 1039] as const,
            inner: [1034, 1038] as const,
          },
        },
        {
          span: {
            outer: [1041, 1047] as const,
            inner: [1043, 1046] as const,
          },
        },
        {
          span: {
            outer: [1049, 1057] as const,
            inner: [1051, 1056] as const,
          },
        },
        {
          span: {
            outer: [1059, 1066] as const,
            inner: [1061, 1065] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
    {
      file: "testFileC.ts",
      enclosure: [1120, 1172] as const,
      span: {
        outer: [1137, 1171] as const,
        inner: [1138, 1170] as const,
      },
      content: [
        {
          type: "str",
          span: [1138, 1145] as const,
        },
        {
          type: "var",
          span: [1145, 1152] as const,
          index: 0,
        },
        {
          type: "str",
          span: [1152, 1154] as const,
        },
        {
          type: "var",
          span: [1154, 1160] as const,
          index: 1,
        },
        {
          type: "str",
          span: [1160, 1162] as const,
        },
        {
          type: "var",
          span: [1162, 1170] as const,
          index: 2,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [1145, 1152] as const,
            inner: [1147, 1151] as const,
          },
        },
        {
          span: {
            outer: [1154, 1160] as const,
            inner: [1156, 1159] as const,
          },
        },
        {
          span: {
            outer: [1162, 1170] as const,
            inner: [1164, 1169] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
    {
      file: "testFileC.ts",
      enclosure: [1201, 1257] as const,
      span: {
        outer: [1218, 1256] as const,
        inner: [1219, 1255] as const,
      },
      content: [
        {
          type: "str",
          span: [1219, 1228] as const,
        },
        {
          type: "var",
          span: [1228, 1236] as const,
          index: 0,
        },
        {
          type: "str",
          span: [1236, 1238] as const,
        },
        {
          type: "var",
          span: [1238, 1245] as const,
          index: 1,
        },
        {
          type: "str",
          span: [1245, 1247] as const,
        },
        {
          type: "var",
          span: [1247, 1255] as const,
          index: 2,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [1228, 1236] as const,
            inner: [1230, 1235] as const,
          },
        },
        {
          span: {
            outer: [1238, 1245] as const,
            inner: [1240, 1244] as const,
          },
        },
        {
          span: {
            outer: [1247, 1255] as const,
            inner: [1249, 1254] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
  ] as const,
} satisfies ParseResultSuccess;

export const TEST_FILE_D_SOURCE = `const length = "3-day";
const destination = "Tokyo";
const audience = "food lovers";
const text =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

// 0
const promptAlphaOriginal =
  "Plan a 3-day trip to Tokyo for food lovers. Avoid touristy spots.";

// 1
const promptBetaOriginal =
  "Give me 5 creative app ideas that use AI for personal productivity.";

// 2
const promptGammaOriginal = \`I want you to act as a creative product strategist specializing in AI-powered tools that improve personal productivity.

Please brainstorm 5 original and feasible app ideas that use artificial intelligence to help individuals manage their time, focus better, or optimize daily workflows. Avoid generic ideas like “AI task manager” or “AI note-taker” — instead, think creatively about emerging behaviors, novel UX patterns, and unique value propositions.

For each app idea, include the following:

Name: A catchy and memorable product name.

Core Concept: A concise description (2-3 sentences) of what the app does and the problem it solves.

AI Capabilities: Explain how AI specifically powers the experience — for example, through context understanding, behavioral prediction, personalization, automation, or multimodal inputs (voice, vision, etc.).

Target Users: Describe who would benefit most from the app — e.g., freelancers, students, parents, executives.

Example Use Case: A short, concrete scenario showing how someone would use the app in their daily routine.

Potential Business Model: (Optional) Suggest how this could be monetized — subscription, B2B licensing, in-app purchases, etc.

Your output should read like a mini product concept brief — concise but full of insight and creativity.

The tone should be professional yet imaginative, similar to how a design strategist or startup founder would pitch early-stage product ideas to investors or collaborators.

Aim for freshness and originality — imagine what productivity tools could look like in 2-3 years, not what already exists today.
\`;

// 3
const promptAlphaMatching = \`Plan a \${length} trip to \${destination} for \${audience}. Avoid touristy spots.\`;

// 4
const promptBetaMatching = \`I want you to generate me 5 creative app ideas that use AI for \${audience}.\`;

// 5
const promptGammaMatching = \`I want you to act as a creative product strategist who specializes in AI-powered tools that enhance personal productivity.

Please brainstorm 5 original and practical app ideas that use artificial intelligence to help individuals manage their time, focus better, or optimize their daily routines. Avoid generic ideas like “AI task manager” or “AI note-taker.” Instead, focus on novel interactions, emerging behaviors, and fresh value propositions.

For each app, include:

Name: A catchy, memorable product name.

Core Concept: A concise 2-3 sentence summary describing what the app does and what problem it solves.

AI Capabilities: Explain how AI powers the experience — e.g., through context awareness, prediction, personalization, automation, or multimodal input (voice, image, etc.).

Target Users: Describe who would benefit most — freelancers, students, parents, or executives.

Example Use Case: Give a short, concrete example of how someone might use the app in daily life.

Potential Business Model: (Optional) Suggest a way it could be monetized — subscription, freemium, B2B licensing, etc.

Your output should read like a mini product concept brief — short but full of insight and creativity.

Keep the tone professional yet imaginative, like a design strategist or startup founder pitching early-stage concepts.

Emphasize freshness and originality — ideas that could realistically exist 2-3 years from now, not ones already on the market.\`;

// 6
const promptAlphaDistinct =
  "Create a detailed itinerary for a week-long vacation in Paris, focusing on art and culture. Include must-visit museums, historical landmarks, local art galleries, and cultural experiences. Provide recommendations for dining options that offer authentic French cuisine, as well as tips for navigating the city using public transportation. Additionally, suggest some off-the-beaten-path attractions that are less known to tourists but highly valued by locals.";

// 7
const promptBetaDistinct =
  "List 10 innovative uses of blockchain technology in the healthcare industry. For each use case, provide a brief explanation of how blockchain can address specific challenges in healthcare, such as data security, patient privacy, interoperability, and supply chain management. Include examples of existing projects or startups that are leveraging blockchain for healthcare solutions. Additionally, discuss potential barriers to adoption and how they might be overcome.";

// 8
const promptGammaDistinct = \`Rewrite this paragraph in a more professional tone:

\${text}\`;
`;

export const TEST_FILE_D_PARSED_RESULT = {
  state: "success",
  prompts: [
    {
      file: "testFileD.ts",
      enclosure: [555, 653] as const,
      span: {
        outer: [585, 652] as const,
        inner: [586, 651] as const,
      },
      content: [
        {
          type: "str",
          span: [586, 651] as const,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [] as const,
      annotations: [] as const,
    },
    {
      file: "testFileD.ts",
      enclosure: [660, 759] as const,
      span: {
        outer: [689, 758] as const,
        inner: [690, 757] as const,
      },
      content: [
        {
          type: "str",
          span: [690, 757] as const,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [] as const,
      annotations: [] as const,
    },
    {
      file: "testFileD.ts",
      enclosure: [766, 2425] as const,
      span: {
        outer: [794, 2424] as const,
        inner: [795, 2423] as const,
      },
      content: [
        {
          type: "str",
          span: [795, 2423] as const,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [] as const,
      annotations: [] as const,
    },
    {
      file: "testFileD.ts",
      enclosure: [2432, 2541] as const,
      span: {
        outer: [2460, 2540] as const,
        inner: [2461, 2539] as const,
      },
      content: [
        {
          type: "str",
          span: [2461, 2468] as const,
        },
        {
          type: "var",
          span: [2468, 2477] as const,
          index: 0,
        },
        {
          type: "str",
          span: [2477, 2486] as const,
        },
        {
          type: "var",
          span: [2486, 2500] as const,
          index: 1,
        },
        {
          type: "str",
          span: [2500, 2505] as const,
        },
        {
          type: "var",
          span: [2505, 2516] as const,
          index: 2,
        },
        {
          type: "str",
          span: [2516, 2539] as const,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [2468, 2477] as const,
            inner: [2470, 2476] as const,
          },
        },
        {
          span: {
            outer: [2486, 2500] as const,
            inner: [2488, 2499] as const,
          },
        },
        {
          span: {
            outer: [2505, 2516] as const,
            inner: [2507, 2515] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
    {
      file: "testFileD.ts",
      enclosure: [2548, 2653] as const,
      span: {
        outer: [2575, 2652] as const,
        inner: [2576, 2651] as const,
      },
      content: [
        {
          type: "str",
          span: [2576, 2639] as const,
        },
        {
          type: "var",
          span: [2639, 2650] as const,
          index: 0,
        },
        {
          type: "str",
          span: [2650, 2651] as const,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [2639, 2650] as const,
            inner: [2641, 2649] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
    {
      file: "testFileD.ts",
      enclosure: [2660, 4162] as const,
      span: {
        outer: [2688, 4161] as const,
        inner: [2689, 4160] as const,
      },
      content: [
        {
          type: "str",
          span: [2689, 4160] as const,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [] as const,
      annotations: [] as const,
    },
    {
      file: "testFileD.ts",
      enclosure: [4169, 4659] as const,
      span: {
        outer: [4199, 4658] as const,
        inner: [4200, 4657] as const,
      },
      content: [
        {
          type: "str",
          span: [4200, 4657] as const,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [] as const,
      annotations: [] as const,
    },
    {
      file: "testFileD.ts",
      enclosure: [4666, 5165] as const,
      span: {
        outer: [4695, 5164] as const,
        inner: [4696, 5163] as const,
      },
      content: [
        {
          type: "str",
          span: [4696, 5163] as const,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [] as const,
      annotations: [] as const,
    },
    {
      file: "testFileD.ts",
      enclosure: [5172, 5263] as const,
      span: {
        outer: [5200, 5262] as const,
        inner: [5201, 5261] as const,
      },
      content: [
        {
          type: "str",
          span: [5201, 5254] as const,
        },
        {
          type: "var",
          span: [5254, 5261] as const,
          index: 0,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [5254, 5261] as const,
            inner: [5256, 5260] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
  ] as const,
} satisfies ParseResultSuccess;

export const TEST_FILE_E_SOURCE = `const one = 1;
const three = 3;
const four = 4;
const gammaPrompt = \`gamma: \${three}, \${four}\`;
const alphaPrompt = \`alphish: \${one}\`;
`;

export const TEST_FILE_E_PARSED_RESULT = {
  state: "success",
  prompts: [
    {
      file: "testFileE.ts",
      enclosure: [48, 95] as const,
      span: {
        outer: [68, 94] as const,
        inner: [69, 93] as const,
      },
      content: [
        {
          type: "str",
          span: [69, 76] as const,
        },
        {
          type: "var",
          span: [76, 84] as const,
          index: 0,
        },
        {
          type: "str",
          span: [84, 86] as const,
        },
        {
          type: "var",
          span: [86, 93] as const,
          index: 1,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [76, 84] as const,
            inner: [78, 83] as const,
          },
        },
        {
          span: {
            outer: [86, 93] as const,
            inner: [88, 92] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
    {
      file: "testFileE.ts",
      enclosure: [96, 134] as const,
      span: {
        outer: [116, 133] as const,
        inner: [117, 132] as const,
      },
      content: [
        {
          type: "str",
          span: [117, 126] as const,
        },
        {
          type: "var",
          span: [126, 132] as const,
          index: 0,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [126, 132] as const,
            inner: [128, 131] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
  ] as const,
} satisfies ParseResultSuccess;

export const TEST_FILE_F_SOURCE = `const one = 1;
const two = 2;
const three = 3;
const four = 4;
const alphaPrompt = \`alpha: \${one}\`;
const betaPrompt = \`beta: \${two}, \${one}\`;
const gammaPrompt = \`gamma: \${three}, \${four}\`;
`;

export const TEST_FILE_F_PARSED_RESULT = {
  state: "success",
  prompts: [
    {
      file: "testFileF.ts",
      enclosure: [63, 99] as const,
      span: {
        outer: [83, 98] as const,
        inner: [84, 97] as const,
      },
      content: [
        {
          type: "str",
          span: [84, 91] as const,
        },
        {
          type: "var",
          span: [91, 97] as const,
          index: 0,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [91, 97] as const,
            inner: [93, 96] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
    {
      file: "testFileF.ts",
      enclosure: [100, 142] as const,
      span: {
        outer: [119, 141] as const,
        inner: [120, 140] as const,
      },
      content: [
        {
          type: "str",
          span: [120, 126] as const,
        },
        {
          type: "var",
          span: [126, 132] as const,
          index: 0,
        },
        {
          type: "str",
          span: [132, 134] as const,
        },
        {
          type: "var",
          span: [134, 140] as const,
          index: 1,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [126, 132] as const,
            inner: [128, 131] as const,
          },
        },
        {
          span: {
            outer: [134, 140] as const,
            inner: [136, 139] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
    {
      file: "testFileF.ts",
      enclosure: [143, 190] as const,
      span: {
        outer: [163, 189] as const,
        inner: [164, 188] as const,
      },
      content: [
        {
          type: "str",
          span: [164, 171] as const,
        },
        {
          type: "var",
          span: [171, 179] as const,
          index: 0,
        },
        {
          type: "str",
          span: [179, 181] as const,
        },
        {
          type: "var",
          span: [181, 188] as const,
          index: 1,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [171, 179] as const,
            inner: [173, 178] as const,
          },
        },
        {
          span: {
            outer: [181, 188] as const,
            inner: [183, 187] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
  ] as const,
} satisfies ParseResultSuccess;

export const TEST_FILE_G_SOURCE = `const one = 1;
const two = 2;
const alphaPrompt = \`ALPHA: \${one}\`;
const betaPrompt = \`BETA: \${two}, \${one}\`;
`;

export const TEST_FILE_G_PARSED_RESULT = {
  state: "success",
  prompts: [
    {
      file: "testFileG.ts",
      enclosure: [30, 66] as const,
      span: {
        outer: [50, 65] as const,
        inner: [51, 64] as const,
      },
      content: [
        {
          type: "str",
          span: [51, 58] as const,
        },
        {
          type: "var",
          span: [58, 64] as const,
          index: 0,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [58, 64] as const,
            inner: [60, 63] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
    {
      file: "testFileG.ts",
      enclosure: [67, 109] as const,
      span: {
        outer: [86, 108] as const,
        inner: [87, 107] as const,
      },
      content: [
        {
          type: "str",
          span: [87, 93] as const,
        },
        {
          type: "var",
          span: [93, 99] as const,
          index: 0,
        },
        {
          type: "str",
          span: [99, 101] as const,
        },
        {
          type: "var",
          span: [101, 107] as const,
          index: 1,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [93, 99] as const,
            inner: [95, 98] as const,
          },
        },
        {
          span: {
            outer: [101, 107] as const,
            inner: [103, 106] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
  ] as const,
} satisfies ParseResultSuccess;

export const TEST_FILE_MISC_SOURCE = `const name = "Sasha";
const greeting = "Hola";
export const helloPrompt = \`Hello, \${name}!\`;
export const greetingPrompt = \`\${greeting}, \${name}!\`;
`;

export const TEST_FILE_MISC_PARSED_RESULT = {
  state: "success",
  prompts: [
    {
      file: "testFileMisc.ts",
      enclosure: [54, 92] as const,
      span: {
        outer: [74, 91] as const,
        inner: [75, 90] as const,
      },
      content: [
        {
          type: "str",
          span: [75, 82] as const,
        },
        {
          type: "var",
          span: [82, 89] as const,
          index: 0,
        },
        {
          type: "str",
          span: [89, 90] as const,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [82, 89] as const,
            inner: [84, 88] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
    {
      file: "testFileMisc.ts",
      enclosure: [100, 147] as const,
      span: {
        outer: [123, 146] as const,
        inner: [124, 145] as const,
      },
      content: [
        {
          type: "var",
          span: [124, 135] as const,
          index: 0,
        },
        {
          type: "str",
          span: [135, 137] as const,
        },
        {
          type: "var",
          span: [137, 144] as const,
          index: 1,
        },
        {
          type: "str",
          span: [144, 145] as const,
        },
      ] as const,
      joint: {
        outer: [0, 0] as const,
        inner: [0, 0] as const,
      },
      vars: [
        {
          span: {
            outer: [124, 135] as const,
            inner: [126, 134] as const,
          },
        },
        {
          span: {
            outer: [137, 144] as const,
            inner: [139, 143] as const,
          },
        },
      ] as const,
      annotations: [] as const,
    },
  ] as const,
} satisfies ParseResultSuccess;

export function parsedPromptVarFactory(
  overrides?: Partial<PromptVar>,
): PromptVar {
  return {
    span: {
      outer: [60, 80],
      inner: [60, 80],
    },
    ...overrides,
  };
}

//#endregion

//#region Legacy ---------------------------------------------------------------

//#region Factories

export function legacyParsedPromptFactory(
  overrides?: Partial<LegacyPrompt>,
): LegacyPrompt {
  return {
    file: editorFilePathFactory(),
    exp: DEFAULT_PROMPT,
    vars: [],
    span: legacyParsedPromptSpanShapeFactory(),
    ...overrides,
  };
}

export function legacyParsedPromptVarFactory(
  overrides?: Partial<LegacyPromptVar>,
): LegacyPromptVar {
  return {
    exp: "${name}",
    span: {
      outer: { start: 60, end: 80 },
      inner: { start: 60, end: 80 },
    },
    ...overrides,
  };
}

export function legacyParsedPromptSpanShapeFactory(
  overrides?: Partial<LegacySpanShape>,
): LegacyPrompt["span"] {
  return {
    outer: LEGACY_DEFAULT_SPAN,
    inner: LEGACY_DEFAULT_SPAN,
    ...overrides,
  };
}

//#endregion

//#region Types

export interface LegacySpan {
  start: number;
  end: number;
}

export interface LegacySpanShape {
  outer: LegacySpan;
  inner: LegacySpan;
}

export interface LegacyPromptVar {
  exp: string;
  span: LegacySpanShape;
}

export interface LegacyPrompt {
  file: string;
  span: LegacySpanShape;
  exp: string;
  vars: Array<LegacyPromptVar>;
}

//#endregion

//#region Utils

export function legacyPlaygroundMapSpanFromPrompt(
  prompt: LegacyPrompt,
): PlaygroundMap.SpanShapeV1 {
  return {
    v: 1,
    outer: { v: 1, ...prompt.span.outer },
    inner: { v: 1, ...prompt.span.inner },
  };
}

export function legacyPlaygroundMapVarsFromPrompt(
  prompt: LegacyPrompt,
): PlaygroundMap.PromptVarV1[] {
  return prompt.vars.map((promptVar) =>
    legacyPlaygroundMapVarFromPromptVarV1(promptVar, prompt.span.outer),
  );
}

export function legacyPlaygroundMapVarFromPromptVarV1(
  promptVar: LegacyPromptVar,
  promptSpan: LegacySpan,
  id?: PlaygroundMap.PromptVarId,
): PlaygroundMap.PromptVarV1 {
  const span: PlaygroundMap.SpanShapeV1 = {
    v: 1,
    outer: {
      v: 1,
      start: promptVar.span.outer.start - promptSpan.start,
      end: promptVar.span.outer.end - promptSpan.start,
    },
    inner: {
      v: 1,
      start: promptVar.span.inner.start - promptSpan.start,
      end: promptVar.span.inner.end - promptSpan.start,
    },
  };

  return {
    v: 1,
    id: id || buildMapPromptVarId(),
    exp: promptVar.exp,
    span,
  };
}

export function legacySpanToLatest(legacySpan: LegacySpan): Span {
  return [legacySpan.start, legacySpan.end];
}

export function legacyParsedPromptToLatest(legacyPrompt: LegacyPrompt): Prompt {
  const content: PromptContentToken[] = [];

  let remainingExp = legacyPrompt.exp;
  legacyPrompt.vars.forEach((legacyVar, varIndex) => {
    const varStartInExp =
      legacyVar.span.outer.start - legacyPrompt.span.outer.start;
    const varEndInExp =
      legacyVar.span.outer.end - legacyPrompt.span.outer.start;

    // Add preceding string token
    if (varStartInExp > 0) {
      content.push({
        type: "str",
        span: [0, varStartInExp],
      });
    }

    // Add variable token
    content.push({
      type: "var",
      span: [varStartInExp, varEndInExp],
      index: varIndex,
    });

    // Update remaining expression
    remainingExp = remainingExp.slice(varEndInExp);
  });

  // Add any remaining string token
  if (remainingExp.length)
    content.push({
      type: "str",
      span: [
        legacyPrompt.exp.length - remainingExp.length,
        legacyPrompt.exp.length,
      ],
    });

  const latestPrompt: Prompt = {
    file: legacyPrompt.file,
    content: [
      {
        type: "str",
        span: legacySpanToLatest(legacyPrompt.span.inner),
      },
    ],
    enclosure: legacySpanToLatest(legacyPrompt.span.outer),
    vars: legacyPrompt.vars.map<PromptVar>(legacyParsedPromptVarToLatest),
    span: {
      outer: legacySpanToLatest(legacyPrompt.span.outer),
      inner: legacySpanToLatest(legacyPrompt.span.inner),
    },
    annotations: [],
    joint: {
      inner: [0, 0],
      outer: [0, 0],
    },
  };

  return latestPrompt;
}

export function legacyParsedSpanFromLatest(latestSpan: Span): LegacySpan {
  return {
    start: latestSpan[0],
    end: latestSpan[1],
  };
}

export function legacyParsedPromptVarToLatest(
  legacyVar: LegacyPromptVar,
): PromptVar {
  return {
    span: {
      outer: legacySpanToLatest(legacyVar.span.outer),
      inner: legacySpanToLatest(legacyVar.span.inner),
    },
  };
}

export function legacyParsedPromptFromLatest(
  source: string,
  latestPrompt: Prompt,
): LegacyPrompt {
  const vars: LegacyPromptVar[] = latestPrompt.vars.map((latestVar) => ({
    exp: sliceSpan(source, latestVar.span.outer),
    span: legacyParsedSpanShapeFromLatest(latestVar.span),
  }));

  const legacyPrompt: LegacyPrompt = {
    file: latestPrompt.file,
    exp: sliceSpan(source, latestPrompt.span.inner),
    span: legacyParsedSpanShapeFromLatest(latestPrompt.span),
    vars,
  };
  return legacyPrompt;
}

export function legacyParsedSpanShapeFromLatest(
  latestSpanShape: SpanShape,
): LegacySpanShape {
  return {
    outer: legacyParsedSpanFromLatest(latestSpanShape.outer),
    inner: legacyParsedSpanFromLatest(latestSpanShape.inner),
  };
}

//#endregion

//#endregion

//#endregion ###################################################################

//#region Playground Map #######################################################

//#region V2 -------------------------------------------------------------------

// TODO:

//#endregion

//#region Latest ---------------------------------------------------------------

export function playgroundMapFileFactory(
  overrides?: Partial<PlaygroundMap.FileV1>,
): PlaygroundMap.FileV1 {
  return {
    v: 1,
    id: buildMapFileId(),
    prompts: [playgroundMapPromptFactoryV1()],
    updatedAt: Date.now(),
    meta: editorFileMetaFactory(),
    ...overrides,
  };
}

export function playgroundMapFactory(
  overrides?: Partial<PlaygroundMap>,
): PlaygroundMap {
  let files = overrides?.files;
  if (!files) {
    const file = editorFileFactory();
    const mapPrompt = playgroundMapPromptFactoryV1();
    const mapFile = playgroundMapFileFactory({
      prompts: [mapPrompt],
      meta: {
        v: 1,
        path: file.path,
        languageId: file.languageId,
        isDirty: file.isDirty,
      },
    });
    files = { [file.path]: mapFile };
  }

  return {
    v: 1,
    files,
    updatedAt: Date.now(),
    ...overrides,
  };
}

export namespace playgroundSetupFactory {
  export interface Props {
    cursorA?: EditorFile.Cursor | undefined;
    cursorB?: EditorFile.Cursor | undefined;
    expAlpha?: string;
    expBeta?: string;
    expGamma?: string;
  }

  export type Result = ReturnType<typeof playgroundSetupFactory>;
}

export function playgroundSetupFactory(
  props: playgroundSetupFactory.Props = {},
) {
  //#region File A

  const cursorA =
    "cursorA" in props ? props.cursorA : editorCursorFactory({ offset: 55 });
  const editorFileA = editorFileFactory({
    cursor: cursorA,
    content: TEST_FILE_A_SOURCE,
  });

  const parsedPromptAlpha = TEST_FILE_A_PARSED_RESULT.prompts[0];
  const mapPromptAlpha = toPlaygroundMapPrompt({
    source: TEST_FILE_A_SOURCE,
    prompt: parsedPromptAlpha,
  });

  const parsedPromptBeta = TEST_FILE_A_PARSED_RESULT.prompts[1];
  const mapPromptBeta = toPlaygroundMapPrompt({
    source: TEST_FILE_A_SOURCE,
    prompt: parsedPromptBeta,
  });

  const parsedPromptsA = [parsedPromptAlpha, parsedPromptBeta] as const;
  const mapPromptsA = [mapPromptAlpha, mapPromptBeta] as const;

  const mapFileA = playgroundMapFileFactory({
    meta: editorFileToMeta(editorFileA),
    prompts: mapPromptsA,
  });

  //#endregion

  //#region File B

  const cursorB =
    "cursorB" in props ? props.cursorB : editorCursorFactory({ offset: 55 });
  const editorFileB = editorFileFactory({
    cursor: cursorB,
    content: TEST_FILE_B_SOURCE,
  });

  const parsedPromptGamma = TEST_FILE_B_PARSED_RESULT.prompts[0];
  const mapPromptGamma = toPlaygroundMapPrompt({
    source: TEST_FILE_B_SOURCE,
    prompt: parsedPromptGamma,
  });

  const parsedPromptsB = [parsedPromptGamma] as const;
  const mapPromptsB = [mapPromptGamma] as const;

  const mapFileB = playgroundMapFileFactory({
    meta: editorFileToMeta(editorFileB),
    prompts: mapPromptsB,
  });

  //#endregion

  const map = playgroundMapFactory({
    files: {
      [editorFileA.path]: mapFileA,
      [editorFileB.path]: mapFileB,
    },
  });

  const pin = null;
  const timestamp = Date.now();
  const playgroundStateProps: ResolvePlaygroundState.Props = {
    timestamp,
    map,
    drafts: {},
    editorFile: editorFileA,
    currentFile: editorFileA,
    parsedPrompts: parsedPromptsA,
    pin,
    parseError: null,
  };

  const parsedPrompts = [...parsedPromptsA, ...parsedPromptsB] as const;
  const mapPrompts = [...mapPromptsA, ...mapPromptsB] as const;

  return {
    timestamp,
    cursorA,
    editorFileA,
    parsedPromptsA,
    mapPromptsA,
    mapFileA,
    cursorB,
    editorFileB,
    parsedPromptsB,
    mapPromptsB,
    mapFileB,
    map,
    pin,
    parsedPrompts,
    mapPrompts,
    playgroundStateProps,
  };
}

//#endregion

//#region V1 -------------------------------------------------------------------

//#region Factories

export function playgroundMapPromptFactoryV1(
  overrides?: Partial<PlaygroundMap.PromptCodeV1>,
): PlaygroundMap.PromptCodeV1 {
  return {
    v: 1,
    type: "code",
    id: buildMapPromptId(),
    content: DEFAULT_PROMPT,
    span: {
      v: 1,
      outer: { v: 1, start: 0, end: 0 },
      inner: { v: 1, start: 0, end: 0 },
    },
    updatedAt: Date.now(),
    vars: [playgroundMapVarFactoryV1()],
    ...overrides,
  };
}

export function playgroundMapPromptDraftFactoryV1(
  overrides?: Partial<PlaygroundMap.PromptDraftV1>,
): PlaygroundMap.PromptDraftV1 {
  return {
    v: 1,
    type: "draft",
    id: buildMapPromptId(),
    content: DEFAULT_PROMPT,
    updatedAt: Date.now(),
    vars: [playgroundMapVarFactoryV1()],
    ...overrides,
  };
}

export function playgroundMapVarFactoryV1(
  overrides?: Partial<PlaygroundMap.PromptVarV1>,
): PlaygroundMap.PromptVarV1 {
  return {
    v: 1,
    id: buildMapPromptVarId(),
    exp: "${name}",
    span: {
      v: 1,
      outer: { v: 1, start: 0, end: 0 },
      inner: { v: 1, start: 0, end: 0 },
    },
    ...overrides,
  };
}

export function playgroundMapPromptFromParsedFactoryV1(
  parsedPrompt: LegacyPrompt,
): PlaygroundMap.PromptCodeV1 {
  return {
    v: 1,
    type: "code",
    id: buildMapPromptId(),
    content: parsedPrompt.exp,
    vars: legacyPlaygroundMapVarsFromPrompt(parsedPrompt),
    span: legacyPlaygroundMapSpanFromPrompt(parsedPrompt),
    updatedAt: Date.now(),
  };
}

export namespace playgroundSetupFactoryV1 {
  export type Result = ReturnType<typeof playgroundSetupFactoryV1>;
}

export function playgroundSetupFactoryV1(
  props: playgroundSetupFactory.Props = {},
) {
  //#region File A

  const cursorA =
    "cursorA" in props ? props.cursorA : editorCursorFactory({ offset: 100 });
  const editorFileA = editorFileFactory({ cursor: cursorA });

  const spanAlpha = { start: 0, end: 5 };
  const parsedPromptAlphaLegacy = legacyParsedPromptFactory({
    file: editorFileA.path,
    exp: props.expAlpha ?? "alpha",
    vars: [legacyParsedPromptVarFactory({ exp: "${one}" })],
    span: legacyParsedPromptSpanShapeFactory({ outer: spanAlpha }),
  });
  const parsedPromptAlpha = legacyParsedPromptToLatest(parsedPromptAlphaLegacy);
  const mapPromptAlpha = playgroundMapPromptFromParsedFactoryV1(
    parsedPromptAlphaLegacy,
  );

  const spanBeta = { start: 6, end: 15 };
  const parsedPromptBetaLegacy = legacyParsedPromptFactory({
    file: editorFileA.path,
    exp: props.expBeta ?? "beta",
    vars: [
      legacyParsedPromptVarFactory({ exp: "${two}" }),
      legacyParsedPromptVarFactory({ exp: "${one}" }),
    ],
    span: legacyParsedPromptSpanShapeFactory({ outer: spanBeta }),
  });
  const parsedPromptBeta = legacyParsedPromptToLatest(parsedPromptBetaLegacy);
  const mapPromptBeta = playgroundMapPromptFromParsedFactoryV1(
    parsedPromptBetaLegacy,
  );

  const parsedPromptsA = [parsedPromptAlpha, parsedPromptBeta] as const;
  const mapPromptsA = [mapPromptAlpha, mapPromptBeta] as const;

  const mapFileA = playgroundMapFileFactory({
    meta: editorFileToMeta(editorFileA),
    prompts: mapPromptsA,
  });

  //#endregion

  //#region File B

  const cursorB =
    "cursorB" in props ? props.cursorB : editorCursorFactory({ offset: 100 });
  const editorFileB = editorFileFactory({ cursor: cursorB });

  const spanGamma = { ...spanBeta };
  const parsedPromptGammaLegacy = legacyParsedPromptFactory({
    file: editorFileB.path,
    exp: props.expGamma ?? "gamma",
    vars: [
      legacyParsedPromptVarFactory({ exp: "${three}" }),
      legacyParsedPromptVarFactory({ exp: "${four}" }),
    ],
    span: legacyParsedPromptSpanShapeFactory({ outer: spanGamma }),
  });
  const parsedPromptGamma = legacyParsedPromptToLatest(parsedPromptGammaLegacy);
  const mapPromptGamma = playgroundMapPromptFromParsedFactoryV1(
    parsedPromptGammaLegacy,
  );

  const parsedPromptsB = [parsedPromptGamma] as const;
  const mapPromptsB = [mapPromptGamma] as const;

  const mapFileB = playgroundMapFileFactory({
    meta: editorFileToMeta(editorFileB),
    prompts: mapPromptsB,
  });

  //#endregion

  const map = playgroundMapFactory({
    files: {
      [editorFileA.path]: mapFileA,
      [editorFileB.path]: mapFileB,
    },
  });

  const pin = null;
  const timestamp = Date.now();
  const playgroundStateProps: ResolvePlaygroundState.Props = {
    timestamp,
    map,
    drafts: {},
    editorFile: editorFileA,
    currentFile: editorFileA,
    parsedPrompts: parsedPromptsA,
    pin,
    parseError: null,
  };

  const parsedPrompts = [...parsedPromptsA, ...parsedPromptsB] as const;
  const mapPrompts = [...mapPromptsA, ...mapPromptsB] as const;

  return {
    timestamp,
    cursorA,
    editorFileA,
    parsedPromptsA,
    mapPromptsA,
    mapFileA,
    cursorB,
    editorFileB,
    parsedPromptsB,
    mapPromptsB,
    mapFileB,
    map,
    pin,
    parsedPrompts,
    mapPrompts,
    playgroundStateProps,
  };
}

//#endregion

//#region Utils

export function playgroundMapPromptCodeV2ToV1(
  promptV2: PlaygroundMap.PromptCodeV2,
): PlaygroundMap.PromptCodeV1 {
  return {
    v: 1,
    type: "code",
    id: promptV2.id,
    content: promptV2.content,
    span: playgroundMapSpanShapeV2ToV1(promptV2.span),
    updatedAt: promptV2.updatedAt,
    vars: promptV2.vars.map(playgroundMapPromptVarV2ToV1),
  };
}

export function playgroundMapPromptVarV2ToV1(
  varV2: PlaygroundMap.PromptVarV2,
): PlaygroundMap.PromptVarV1 {
  return {
    v: 1,
    id: varV2.id,
    exp: varV2.content.outer,
    span: playgroundMapSpanShapeV2ToV1(varV2.span),
  };
}

export function playgroundMapSpanShapeV2ToV1(
  spanV2: PlaygroundMap.SpanShapeV2,
): PlaygroundMap.SpanShapeV1 {
  return {
    v: 1,
    outer: playgroundMapSpanV2ToV1(spanV2.outer),
    inner: playgroundMapSpanV2ToV1(spanV2.inner),
  };
}

export function playgroundMapSpanV2ToV1(
  spanV2: PlaygroundMap.SpanV2,
): PlaygroundMap.SpanV1 {
  return {
    v: 1,
    start: spanV2[0],
    end: spanV2[1],
  };
}

//#endregion

//#endregion

//#endregion ###################################################################
