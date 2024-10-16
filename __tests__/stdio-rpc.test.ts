import { expect, test, describe } from "bun:test";
import { RPCChannel } from "../src/channel.ts";
import { apiMethods, type API } from "./scripts/api.ts";
import { spawn } from "child_process";
import { NodeStdio, DenoStdio } from "../mod.ts";
import path from "node:path";
import type { ChildProcessWithoutNullStreams } from "node:child_process";

function getProjectRoot(): string {
  const fileUrl = new URL(import.meta.url).pathname;
  const folderPath = path.dirname(path.dirname(fileUrl));
  return folderPath;
}


const projectRoot = getProjectRoot();
const testsPath = path.join(projectRoot, "__tests__");
console.log("testsPath", testsPath);

async function runWorker(worker: ChildProcessWithoutNullStreams) {
  // worker.stderr.pipe(process.stdout);

  // const stdio = createStdio();
  const stdio = new NodeStdio(worker.stdout, worker.stdin);
  const parent = new RPCChannel<{}, API>(stdio, {});
  const api = parent.getApi();

  expect(await api.add(1, 2)).toEqual(3);
  const sum2 = await new Promise((resolve, reject) => {
    api.addCallback(1, 2, (sum) => {
      resolve(sum);
    });
  });

  expect(sum2).toEqual(3);
  expect(await api.subtract(1, 2)).toEqual(-1);

  // stress test
  for (let i = 0; i < 1000; i++) {
    expect(await api.add(i, i)).toEqual(i + i);
    expect(await api.subtract(i, i)).toEqual(0);
  }
  // stress test with concurrent calls
  await Promise.all(
    Array(5_000)
      .fill(0)
      .map(async (x, idx) => expect(await api.add(idx, idx)).toEqual(idx + idx))
  );
  await Promise.all(
    Array(5_000)
      .fill(0)
      .map(() =>
        api.addCallback(1, 2, (sum) => {
          //   expect(sum).toEqual(3);
        })
      )
  );
  const dummyCallback = (sum: number) => {};
  await Promise.all(
    Array(5_000)
      .fill(0)
      .map(() => api.addCallback(1, 2, dummyCallback))
  );
  worker.kill();
}

describe("RPCChannel Test", () => {
  test("DenoStdio", async () => {
    const workerDeno = spawn("deno", [
      path.join(testsPath, "scripts/deno-api.ts"),
    ]);
    await runWorker(workerDeno);
  });
  test("NodeStdio", async () => {
    const workerBun = spawn("node", [
      path.join(testsPath, "scripts/node-api.js"),
    ]);
    await runWorker(workerBun);
  });
});
