// workerProcess.ts
import { Worker } from "./src/worker";
import { apiMethods } from "./src/api";

// Instantiate the worker with the defined API methods
new Worker(apiMethods);
