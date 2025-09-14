import { describe, expect, it } from "vitest";
import { FileName, fileNameView } from "./name";

describe(fileNameView, () => {
  it("returns file name view", () => {
    expect(fileNameView("file.txt")).toEqual<FileName.View>({
      pre: "",
      main: "file",
      post: ".txt",
    });
  });

  it("returns empty view for empty path", () => {
    expect(fileNameView("")).toEqual<FileName.View>({
      pre: "",
      main: "",
      post: "",
    });
  });

  it("returns module as main for index files", () => {
    expect(fileNameView("path/to/module/index.js")).toEqual<FileName.View>({
      pre: "path/to/",
      main: "module",
      post: "/index.js",
    });
    expect(fileNameView("module/index.html")).toEqual<FileName.View>({
      pre: "",
      main: "module",
      post: "/index.html",
    });
  });
});
