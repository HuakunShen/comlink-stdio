import { ProcessChannel } from "../src/bidirectional.ts";
import { apiMethods, type API } from "./api.ts";
import { spawn } from "child_process";
import { NodeStdio } from "../src/stdio/index.ts";

const worker = spawn("deno", ["examples/deno-child.ts"]);
// const worker = spawn("bun", ["examples/node-child.ts"]);
worker.stderr.pipe(process.stdout);

// const stdio = createStdio();
const stdio = new NodeStdio(worker.stdout, worker.stdin);
const parent = new ProcessChannel<{}, API>(stdio, {});
const api = parent.getApi();

await api.add(1, 2).then(console.log);
await api.subtract(1, 2).then(console.log);
worker.kill();
