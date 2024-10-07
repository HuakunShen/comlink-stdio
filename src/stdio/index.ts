import { isDeno, isNode } from "../env";
import { DenoStdio } from "./deno";
import { NodeStdio } from "./node";

import type { StdioInterface } from "./stdio";

export function createStdio(): StdioInterface {
  //   if (typeof process !== "undefined" && process.stdin && process.stdout) {
  if (isNode) {
    // Assume Node.js environment
    return new NodeStdio();
  } else if (isDeno) {
    //   } else if (typeof Deno !== "undefined" && Deno.stdin && Deno.stdout) {
    // Assume Deno environment
    return new DenoStdio();
  } else {
    throw new Error(
      "Unsupported environment: Neither Node.js nor Deno detected."
    );
  }
}
