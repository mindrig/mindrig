import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { format } from "prettier";

//#region Settings

const fontType = "woff2";
const codepointBase = 0xe000;
const codepointLimit = 0xf8ff;
const fontPath = `./assets/icons.${fontType}`;
const iconIdPrefix = "mindrig-";

const rootDir = relative(
  process.cwd(),
  resolve(import.meta.dirname, "..", ".."),
);
const iconsDir = join(rootDir, "icons");
const fantasticonConfigPath = join(rootDir, ".fantasticonrc.json");
const packageJsonPath = join(rootDir, "package.json");

const descriptions = {
  "toolbar-icon": "Mind Rig toolbar icon",
};

//#endregion

//#region Main

console.log("🚧 Generating icons font & metadata...\n");

const iconIds = await getIconIds();

console.log(`🔵 Found ${iconIds.length} icons`);

const codepoints = assignCodepoints(iconIds);

await Promise.all([
  updateFantasticonConfig(codepoints),
  updateContributes(codepoints!),
]);

console.log("\n💚 Icons font & metadata updated!");

//#endregion

//# Utils

async function getIconIds(): Promise<string[]> {
  const files = await readdir(iconsDir);
  const iconNames = files
    .filter((fileName) => fileName.toLowerCase().endsWith(".svg"))
    .map((fileName) => fileName.replace(/\.svg$/i, ""))
    .sort((a, b) => a.localeCompare(b));
  if (!iconNames.length) console.log(`🟡 No icons found in ${iconsDir}`);

  return iconNames;
}

function assignCodepoints(iconIds: string[]): Codepoints {
  const codepoints = new Map<string, number>();

  let codepoint = codepointBase;
  for (const id of iconIds) {
    if (codepoint > codepointLimit)
      throw new Error("🔴 Ran out of private-use codepoints for icons");
    codepoints.set(id, codepoint);
    codepoint += 1;
  }

  return Object.fromEntries(
    Array.from(codepoints.entries()).sort(([a], [b]) => a.localeCompare(b)),
  );
}

function updateFantasticonConfig(
  codepoints: Record<string, number>,
): Promise<void> {
  console.log(`🔵 Updating codepoints in ${fantasticonConfigPath}...`);
  return updateJson<FantasticonConfig>(fantasticonConfigPath, (config) => {
    config.codepoints = codepoints;
  });
}

function updateContributes(codepoints: Codepoints): Promise<void> {
  console.log(`🔵 Updating contributes.icons in ${packageJsonPath}...`);
  return updateJson<PackageJson>(packageJsonPath, (packageJson) => {
    const contributes = (packageJson.contributes =
      packageJson.contributes ?? {});
    contributes.icons = buildIconContribution(codepoints, descriptions);
  });
}

async function updateJson<Type>(
  jsonPath: string,
  updater: (data: Type) => void,
): Promise<void> {
  const data = await readJson<Type>(jsonPath);
  updater(data);
  await writeJson(jsonPath, data);
}

async function readJson<Type>(jsonPath: string): Promise<Type> {
  const json = await readFile(jsonPath, "utf8");
  return JSON.parse(json);
}

async function writeJson(jsonPath: string, data: unknown): Promise<void> {
  const json = await format(JSON.stringify(data), { parser: "json" });
  await writeFile(jsonPath, json, "utf8");
}

function buildIconContribution(
  codepoints: Codepoints & {},
  descriptions: Descriptions & {},
): VsCodeIconContributions {
  const entries = Object.entries(codepoints).map(([iconId, codepoint]) => {
    const description =
      descriptions[iconId] || "TODO: Add description to .fantasticonrc.json";
    const fontCharacter = `\\${codepoint.toString(16).padStart(4, "0").toUpperCase()}`;

    const vscId = `${iconIdPrefix}${iconId}`;
    const contribution: VsCodeIconContribution = {
      description,
      default: {
        fontPath,
        fontCharacter,
      },
    };

    return [vscId, contribution] as const;
  });
  return Object.fromEntries(entries);
}

//#endregion

//#region Types

type Codepoints = Record<string, number>;

type Descriptions = Record<string, string>;

interface PackageJson {
  contributes?: PackageJsonContributes;
  [key: string]: unknown;
}

interface PackageJsonContributes {
  icons?: VsCodeIconContributions;
  [key: string]: unknown;
}

type VsCodeIconContributions = Record<string, VsCodeIconContribution>;

interface VsCodeIconContribution {
  description: string;
  default: {
    fontPath: string;
    fontCharacter: string;
  };
}

interface FantasticonConfig {
  codepoints?: Codepoints;
  [key: string]: unknown;
}

//#endregion
