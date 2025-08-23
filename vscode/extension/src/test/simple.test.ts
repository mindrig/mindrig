import * as assert from "assert";
import * as vscode from "vscode";

suite("Simple tests", () => {
  test("Extension exists", async () => {
    const extension = vscode.extensions.getExtension("mindcontrol.vscode");
    assert.ok(extension !== undefined, "Extension should be found");
  });
});
