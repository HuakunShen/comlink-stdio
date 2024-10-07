// @ts-ignore
export const isDeno = typeof Deno !== "undefined";
// Bun also recognized as Node.js
export const isNode =
  typeof process !== "undefined" && process.release?.name === "node";
