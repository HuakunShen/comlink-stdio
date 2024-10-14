import { RPCChannel } from "../src/channel.ts";
import { apiMethods } from "./api.ts";
import { DenoStdio } from "../src/stdio/deno.ts";

const stdio = new DenoStdio(Deno.stdin.readable, Deno.stdout.writable);
const child = new RPCChannel(stdio, apiMethods);
