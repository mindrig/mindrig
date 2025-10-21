import * as vscode from "vscode";

export async function resolveDevServerUri(): Promise<vscode.Uri> {
  const localUri = vscode.Uri.parse("http://localhost:3191");
  return vscode.env.asExternalUri(localUri);
}
