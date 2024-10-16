import path from "node:path";
import { fileURLToPath } from 'node:url';

export function generateUUID(): string {
  return new Array(4)
    .fill(0)
    .map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16))
    .join("-");
}

export function getProjectRoot(): string {
  // const fileUrl = new URL(import.meta.url).pathname;
  const __filename = fileURLToPath(import.meta.url);
  const folderPath = path.dirname(path.dirname(__filename));
  return folderPath;
}
