import { always } from "alwaysly";
import * as vscode from "vscode";

export function fileNameFromUri(uri: vscode.Uri): string {
  const name = uri.path.split("/").pop();
  always(name);
  return name;
}
