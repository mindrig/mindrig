export namespace FileName {
  export interface View {
    pre: string;
    main: string;
    post: string;
  }
}

export function fileNameView(path: string): FileName.View {
  const nameIdx = lastDelimiter(path);
  const name = nameIdx === -1 ? path : path.slice(nameIdx + 1);
  if (!name) return { pre: "", main: "", post: "" };

  let pre = nameIdx === -1 ? "" : path.slice(0, nameIdx + 1);

  const dotIdx = name.lastIndexOf(".");
  let main = name.slice(0, dotIdx);
  let post = dotIdx === -1 ? "" : name.slice(dotIdx);

  const base = name.slice(0, dotIdx === -1 ? 0 : dotIdx);
  if (base === "index") {
    // If that's an index file, use the parent directory as the main name
    const moduleIdx = lastDelimiter(pre.slice(0, -1));
    main = pre.slice(moduleIdx + 1, -1);
    pre = path.slice(0, moduleIdx + 1);
    post = nameIdx === -1 ? "" : path.slice(nameIdx);
  }

  return {
    pre,
    main,
    post,
  };
}

function lastDelimiter(path: string): number {
  return path.match(/[\\/](?!.*[\\/])/)?.index ?? -1;
}
