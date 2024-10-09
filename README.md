# comlink-stdio

[![NPM Version](https://img.shields.io/npm/v/comlink-stdio)](https://www.npmjs.com/package/comlink-stdio)
[![Publish](https://github.com/HuakunShen/comlink-stdio/actions/workflows/jsr-publish.yml/badge.svg)](https://github.com/HuakunShen/comlink-stdio/actions/workflows/jsr-publish.yml)

- [TypeDoc Documentation](https://huakunshen.github.io/comlink-stdio/)
- [JSR Documentation](https://jsr.io/@hk/comlink-stdio/doc)

This project is a stdio version of comlink. Making it easier to do IPC between TypeScript processes using RPC style API calls.

> Regular js/ts files can directly import/require each other as libraries, this package isn't designed for these normal use cases, but designed for special scenarios where 2 JS processes are not in the same environment. 
> e.g. I am running main process with Tauri in a web brower, it needs to run a Deno process (which has more acess to the OS resources), in this scenario both sides are js/ts but they can't import each other as libraries. Instead of starting an http server using Deno/Node/Bun, stdio is more lightweight. 
> However, stdio's `argv`, `stdin`, `stdout` is too low level, implementing API calls with them requires CLI-style programming, which is very inconvenient.
> `comlink-stdio` mimics `comlink` style API, making RPC-style API calls over stdio very easy.

> This package is a completly TypeScript project, no JS bundle will be generated. If you write JS, you lose the main benefit of this package, which is RPC with type auto-complete.

## Support

- Node.JS
- Deno
- Bun

## Usage

See `examples`,

```bash
bun examples/parent.ts
```

`parent.ts`, run `bun examples/parent.ts`

```ts
import { StdioRPCChannel } from "../src/bidirectional.ts";
import { apiMethods, type API } from "../src/api.ts";
import { spawn } from "child_process";
import { NodeStdio } from "../src/stdio/index.ts";

const worker = spawn("deno", ["examples/deno-child.ts"]);
// or
const worker = spawn("bun", ["examples/node-child.ts"]);
worker.stderr.pipe(process.stdout);

const stdio = new NodeStdio(worker.stdout, worker.stdin);
const parent = new StdioRPCChannel<{}, API>(stdio, {});
const api = parent.getApi();

await api.add(1, 2).then(console.log); // 3
await api.subtract(1, 2).then(console.log); // -1
worker.kill();
```

`examples/node-child.ts`

```ts
import { StdioRPCChannel } from "../src/bidirectional.ts";
import { apiMethods } from "./api.ts";
import { DenoStdio, NodeStdio } from "../src/stdio/index.ts";

const stdio = new NodeStdio(process.stdin, process.stdout);
const child = new StdioRPCChannel(stdio, apiMethods);
```


`examples/deno-child.ts`

```ts
import { StdioRPCChannel } from "../src/bidirectional.ts";
import { apiMethods } from "./api.ts";
import { DenoStdio, NodeStdio } from "../src/stdio/index.ts";

const stdio = new DenoStdio(Deno.stdin.readable, Deno.stdout.writable);
const child = new StdioRPCChannel(stdio, apiMethods);
```


`StdioRPCChannel` is a bidirectional IPC channel, it can send and receive messages between processes.
JavaScript proxy is used to forward API calls over stdio. You just need to pass an API interface to `StdioRPCChannel` as generic, then you get full auto-complete and type safety.

Since `StdioRPCChannel` is a bidirectional channel, both process can serve as API server, and they can call each other's API.
