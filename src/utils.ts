import path from "node:path";

export function generateUUID(): string {
  return new Array(4)
    .fill(0)
    .map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16))
    .join("-");
}

export function getProjectRoot(): string {
  const fileUrl = new URL(import.meta.url).pathname;
  const folderPath = path.dirname(path.dirname(fileUrl));
  return folderPath;
}
