export namespace Language {
  export type Id = (typeof languages)[number];
}

export const languages = ["ts", "js", "py"] as const;
