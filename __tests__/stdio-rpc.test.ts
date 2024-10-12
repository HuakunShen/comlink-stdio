import { expect, test, describe } from "bun:test";
import { StdioRPCChannel } from "../src/channel.ts";
import { apiMethods, type API } from "./scripts/api.ts";
import { spawn } from "child_process";
import { NodeStdio, DenoStdio } from "../mod.ts";
import path from "node:path";
import { getProjectRoot } from "../src/utils.ts";
import type { ChildProcessWithoutNullStreams } from "node:child_process";

const projectRoot = getProjectRoot();
const testsPath = path.join(projectRoot, "__tests__");
console.log("testsPath", testsPath);

async function runWorker(worker: ChildProcessWithoutNullStreams) {
  worker.stderr.pipe(process.stdout);

  // const stdio = createStdio();
  const stdio = new NodeStdio(worker.stdout, worker.stdin);
  const parent = new StdioRPCChannel<{}, API>(stdio, {});
  const api = parent.getApi();

  expect(await api.add(1, 2)).toEqual(3);
  const sum2 = await new Promise((resolve, reject) => {
    api.addCallback(1, 2, (sum) => {
      resolve(sum);
    });
  });

  expect(sum2).toEqual(3);
  expect(await api.subtract(1, 2)).toEqual(-1);
  worker.kill();
}

describe("StdioRPCChannel Test", () => {
  test("DenoStdio", async () => {
    const workerDeno = spawn("deno", [
      path.join(testsPath, "scripts/deno-api.ts"),
    ]);
    await runWorker(workerDeno);
  });
  test("NodeStdio", async () => {
    const workerBun = spawn("bun", [
      path.join(testsPath, "scripts/node-api.ts"),
    ]);
    await runWorker(workerBun);
  });
});
