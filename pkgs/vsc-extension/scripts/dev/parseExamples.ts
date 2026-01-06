#!/usr/bin/env -S pnpm tsx

import * as fs from "fs/promises";
import * as path from "path";
import pc from "picocolors";
import { parsePrompts } from "volumen";

const SCRIPT_STEM = "parseExamples";
const EXAMPLES = [
  "testFileA.ts",
  "testFileB.ts",
  "testFileC.ts",
  "testFileD.ts",
  "testFileE.ts",
  "testFileF.ts",
  "testFileG.ts",
  "testFileMisc.ts",
];
const TARGETS = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
if (!TARGETS.length) TARGETS.push(...EXAMPLES);

main();

async function main() {
  for (const fileName of TARGETS) {
    await parsePrint(fileName);
  }
}

async function parsePrint(fileName: string) {
  const filePath = path.join(__dirname, SCRIPT_STEM, fileName);
  const source = await fs.readFile(filePath, "utf-8");
  const result = await parsePrompts(source, fileName);

  const stem = path.basename(fileName, path.extname(fileName));
  const constName = camelCaseToSnakeCaseUpper(stem);

  console.log();

  console.log(pc.dim("===================================="));
  console.log(pc.blue(fileName));

  console.log(pc.dim("===================================="));
  console.log(pc.greenBright(source));

  console.log(pc.dim("------------------------------------"));
  const escapedSource = source.replace(/`/g, "\\`").replace(/\${/g, "\\${");
  console.log(
    pc.cyanBright(`export const ${constName}_SOURCE = \`${escapedSource}\`;`),
  );
  console.log();
  const constanizedJson = JSON.stringify(result, null, 2).replace(
    /\]/g,
    "] as const",
  );
  console.log(
    pc.cyanBright(
      `export const ${constName}_PARSED_RESULT = ${constanizedJson} satisfies ParseResultSuccess;`,
    ),
  );

  console.log(pc.dim("===================================="));
  console.log();
}

function camelCaseToSnakeCaseUpper(str: string): string {
  return camelCaseToSnakeCase(str).toUpperCase();
}

function camelCaseToSnakeCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}
