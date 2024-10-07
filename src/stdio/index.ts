import { isDeno, isNode } from "../env.ts";
import { DenoStdio } from "./deno.ts";
import { NodeStdio } from "./node.ts";
import type { StdioInterface } from "./stdio.ts";

export * from "./stdio.ts";
export { NodeStdio } from "./node.ts";
export { DenoStdio } from "./deno.ts";
