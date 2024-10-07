import { ProcessChannel } from "./src/bidirectional";
import { apiMethods } from "./src/api";

const child = new ProcessChannel(process.stdin, process.stdout, apiMethods);
