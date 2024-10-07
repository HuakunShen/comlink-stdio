import { proxy, wrap } from "@huakunshen/comlink";
import { ProcessChannel } from "./src/bidirectional";
import { apiMethods, type API } from "./src/api";
import { spawn } from "child_process";
import { NodeStdio } from "./src/stdio";
// import { createStdio } from "./src/stdio";

const worker = spawn("bun", ["child.ts"]);
worker.stderr.pipe(process.stdout);

// const stdio = createStdio();
const stdio = new NodeStdio(worker.stdout, worker.stdin);
const parent = new ProcessChannel<{}, API>(stdio, {});
const api = parent.getApi();

await api.add(1, 2).then(console.log);
await api.subtract(1, 2).then(console.log);
worker.kill();
