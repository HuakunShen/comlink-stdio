import { RPCChannel } from "../src/channel.ts";
import { apiMethods, type API } from "./api.ts";
import { spawn } from "child_process";
import { NodeStdio } from "../mod.ts";

// const worker = spawn("deno", ["examples/deno-child.ts"]);
const worker = spawn("bun", ["examples/node-child.ts"]);
worker.stderr.pipe(process.stdout);

// const stdio = createStdio();
const stdio = new NodeStdio(worker.stdout, worker.stdin);
const parent = new RPCChannel<{}, API>(stdio, {});
const api = parent.getApi();

for (let i = 0; i < 100; i++) {
  await api.add(1, 2);
  await api.addCallback(1, 2, (sum) => {
    // console.log("sum from callback", sum);
  });
}

function addCallback2(sum: number) {
  // console.log("sum from callback", sum);
}
await Promise.all(
  Array(5000)
    .fill(0)
    .map(() => api.add(1, 2).then(() => api.addCallback(1, 2, (sum) => {})))
);
await Promise.all(
  Array(5000)
    .fill(0)
    .map(() => api.add(1, 2).then(() => api.addCallback(1, 2, addCallback2)))
);

await api.add(1, 2).then(console.log);
api.addCallback(1, 2, (sum) => {
  console.log("sum from callback", sum);
});
await api.subtract(1, 2).then(console.log);
worker.kill();
