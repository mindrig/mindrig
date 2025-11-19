import type { Smollog } from "smollog";

export interface Settings {
  playground?: Settings.Playground | undefined;
  dev?: Settings.Dev | undefined;
}

export namespace Settings {
  export interface Playground {
    showSource?: boolean | undefined;
    parallelRequests?: number | undefined;
  }

  export interface Dev {
    logsVerbosity?: DevLogsVerbosity;
  }

  export type DevLogsVerbosity = Smollog.Level | "silent" | undefined;
}
