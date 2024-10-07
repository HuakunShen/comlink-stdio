import { ProcessChannel } from "./src/bidirectional";
import { apiMethods } from "./src/api";
import { NodeStdio } from "./src/stdio";
// import { createStdio } from "./src/stdio";

// const stdio = createStdio();
const stdio = new NodeStdio(process.stdin, process.stdout);
const child = new ProcessChannel(stdio, apiMethods);
