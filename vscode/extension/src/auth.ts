import * as vscode from "vscode";

export type AuthContext = AuthContextGuest | AuthContextLoggedIn;

export interface AuthContextGuest {
  loggedIn: false;
}

export interface AuthContextLoggedIn {
  loggedIn: true;
}

export function setAuthContext(context: AuthContext) {
  Object.entries(context).forEach(([key, value]) => {
    vscode.commands.executeCommand("setContext", `mindrig.auth.${key}`, value);
  });
}
