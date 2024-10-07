import { proxy } from "@huakunshen/comlink";
import { ProcessChannel } from "./src/bidirectional";
import { apiMethods, type API } from "./src/api";
import { spawn } from "child_process";

const worker = spawn("bun", ["child.ts"]);

const parent = new ProcessChannel<{}, API>(worker.stdout!, worker.stdin!, {});
const api = parent.getApi();

await api.add(1, 2).then(console.log);
await api.subtract(1, 2).then(console.log);
worker.kill();
