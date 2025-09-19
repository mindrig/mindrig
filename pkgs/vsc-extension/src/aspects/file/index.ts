export function fileExtFromPath(filePath: string): string | undefined {
  const dotIdx = filePath.lastIndexOf(".");
  if (dotIdx === -1) return undefined;
  return filePath.slice(dotIdx + 1).toLowerCase();
}
