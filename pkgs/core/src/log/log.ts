import type { Smollog } from "smollog";
import { Settings } from "../settings";

export function createLogWrap(): Smollog.Wrap {
  return (_, ...entries) => formatLogEntries(entries);
}

export function formatLogEntries(entries: unknown[]): unknown[] {
  return [
    [
      colorize("[Mind Rig]", [93]),
      colorize(`[${new Date().toISOString()}]`, [90]),
    ].join(" "),
    ...entries,
  ];
}

function colorize(str: string, codes: number[]): string {
  return `${ansiEscapeSeq(...codes)}${str}`;
}

function ansiEscapeSeq(...codes: number[]): string {
  return `\x1B[${codes.join(";")}m`;
}

export const defaultLogLevel: Smollog.Level = "debug";

export function logsVerbositySettingToLevel(
  verbosity: Settings.DevLogsVerbosity,
): Smollog.Level | null {
  if (verbosity === "silent") return null;
  return verbosity || "debug";
}
