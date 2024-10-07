export const isDeno = typeof Deno !== "undefined";
export const isNode =
  typeof process !== "undefined" && process.release?.name === "node";
