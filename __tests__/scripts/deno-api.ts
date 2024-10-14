import { RPCChannel } from "../../src/channel.ts";
import { apiMethods } from "./api.ts";
import { DenoStdio } from "../../mod.ts";

const stdio = new DenoStdio(Deno.stdin.readable, Deno.stdout.writable);
const child = new RPCChannel(stdio, apiMethods);
