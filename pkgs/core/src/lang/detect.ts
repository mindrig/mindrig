import type { Language } from "./language";

const idToVscIds: Record<Language.IdKnown, string[]> = {
  ts: ["typescript", "typescriptreact"],
  js: ["javascript", "javascriptreact"],
  py: ["python"],
};

export function languageIdFromVsc(
  vscLanguageId: string,
): Language.Id | undefined {
  return mapId(idToVscIds, vscLanguageId);
}

export const LANGUAGE_EXTENSIONS: Record<Language.IdKnown, string[]> = {
  ts: ["ts", "tsx"],
  js: ["js", "jsx", "mjs", "mjsx", "cjs", "cjsx"],
  py: ["py", "pyi"],
};

export function languageIdFromExt(
  vscLanguageId: string | undefined,
): Language.Id {
  return mapId(LANGUAGE_EXTENSIONS, vscLanguageId) || "unknown";
}

type IdMap = Record<Language.IdKnown, string[]>;

function mapId(
  map: IdMap,
  str: string | undefined,
): Language.IdKnown | undefined {
  if (!str) return;
  for (const [id, vscIds] of Object.entries(map)) {
    if (vscIds.includes(str)) return id as Language.IdKnown;
  }
}
