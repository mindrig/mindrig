import "@testing-library/jest-dom/vitest";
import { beforeEach, vi } from "vitest";

//#region console

const originalConsole = global.console;

beforeEach(mockConsole);

export function mockConsole() {
  global.console = {
    ...originalConsole,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
  };
}

export function restoreConsole() {
  global.console = originalConsole;
}

//#endregion
