import { RPCChannel } from "../src/channel.ts";
import { apiMethods } from "./api.ts";
import { NodeStdio } from "../mod.ts";

const stdio = new NodeStdio(process.stdin, process.stdout);
const child = new RPCChannel(stdio, apiMethods);
