import { ProcessChannel } from "../src/bidirectional.ts";
import { apiMethods } from "./api.ts";
import { DenoStdio, NodeStdio } from "../src/stdio/index.ts";

const stdio = new DenoStdio(Deno.stdin.readable, Deno.stdout.writable);
const child = new ProcessChannel(stdio, apiMethods);
