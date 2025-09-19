import * as vscode from "vscode";

export async function resolveDevServerUri(): Promise<vscode.Uri> {
  const localUri = vscode.Uri.parse("http://localhost:5173");
  return vscode.env.asExternalUri(localUri);
}
