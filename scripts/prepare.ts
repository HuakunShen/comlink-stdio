import { $ } from "bun";

// bun build --target node __tests__/scripts/node-api.ts > __tests__/scripts/node-api.js

await Bun.build({
  entrypoints: ["./__tests__/scripts/node-api.ts"],
  outdir: "./__tests__/scripts",
  target: "node",
});

await Bun.build({
  entrypoints: ["./examples/node-child.ts"],
  outdir: "./examples",
  target: "node",
});
