// stdio_node.ts
import { type StdioInterface } from "./stdio.ts";

/**
 * Stdio implementation for Node.js
 * Simply wrap Node.js's `process.stdin` and `process.stdout` to follow StdioInterface
 */
export class NodeStdio implements StdioInterface {
  constructor(
    private readStream: NodeJS.ReadableStream = process.stdin,
    private writeStream: NodeJS.WritableStream = process.stdout
  ) {}

  async read(): Promise<Buffer | null> {
    return new Promise((resolve, reject) => {
      this.readStream.on("data", (chunk) => {
        resolve(chunk);
      });
      this.readStream.on("end", () => {
        // resolve(Buffer.concat(chunks));
      });
      this.readStream.on("error", reject);
    });
  }

  async write(data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.writeStream.write(data, (err) => {
        if (err) reject(err);
        else {
          resolve();
        }
      });
    });
  }
}
