export namespace Language {
  export type Id = IdKnown | "unknown";

  export type IdKnown = (typeof languages)[number];
}

export const languages = [
  "ts",
  "js",
  "py",
  "php",
  "rb",
  "go",
  "java",
  "cs",
] as const;
