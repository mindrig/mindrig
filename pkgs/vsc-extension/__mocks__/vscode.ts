/**
 * Mock implementation of VS Code API for unit testing
 */
import { vi } from "vitest";

// Mock VS Code API types and functions
export const extensions = {
  getExtension: vi.fn().mockReturnValue({
    id: "mindrig.vscode",
    extensionUri: { fsPath: "/mock/path" },
    isActive: true,
    activate: vi.fn(),
    packageJSON: {},
  }),
};

export const workspace = {
  getConfiguration: vi.fn().mockReturnValue({
    get: vi.fn(),
    update: vi.fn(),
  }),
  onDidChangeTextDocument: vi.fn(),
  applyEdit: vi.fn().mockResolvedValue(true),
  textDocuments: [],
};

export const window = {
  createWebviewPanel: vi.fn(),
  showInformationMessage: vi.fn(),
  showErrorMessage: vi.fn(),
};

export class Uri {
  static file(path: string) {
    return { fsPath: path, toString: () => path };
  }

  static parse(path: string) {
    return { fsPath: path, toString: () => path };
  }
}

export class Range {
  constructor(
    public start: any,
    public end: any,
  ) {}
}

export class Position {
  constructor(
    public line: number,
    public character: number,
  ) {}
}

export class WorkspaceEdit {
  replace = vi.fn();
  insert = vi.fn();
  delete = vi.fn();
}

// Mock disposable
export class Disposable {
  dispose = vi.fn();
}

// Mock common VS Code enums/constants
export enum ViewColumn {
  Active = -1,
  Beside = -2,
  One = 1,
  Two = 2,
  Three = 3,
}
