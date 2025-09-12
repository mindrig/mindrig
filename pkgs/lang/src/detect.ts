import type { Language } from "./types";

const idToVscIds: Record<Language.Id, string[]> = {
  ts: ["typescript", "typescriptreact"],
  js: ["javascript", "javascriptreact"],
  py: ["python"],
};

export function languageIdFromVsc(
  vscLanguageId: string,
): Language.Id | undefined {
  return mapId(idToVscIds, vscLanguageId);
}

const idToExts: Record<Language.Id, string[]> = {
  ts: ["ts", "tsx"],
  js: ["js", "jsx", "mjs", "mjsx", "cjs", "cjsx"],
  py: ["py", "pyi"],
};

export function languageIdFromExt(
  vscLanguageId: string | undefined,
): Language.Id | undefined {
  return mapId(idToExts, vscLanguageId);
}

type IdMap = Record<Language.Id, string[]>;

function mapId(map: IdMap, str: string | undefined): Language.Id | undefined {
  if (!str) return;
  for (const [id, vscIds] of Object.entries(map)) {
    if (vscIds.includes(str)) return id as Language.Id;
  }
}
