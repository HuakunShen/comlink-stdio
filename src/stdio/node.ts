// stdio_node.ts
import { type StdioInterface } from "./interface.ts";
import { Readable, Writable } from "node:stream";
import { type Buffer } from "node:buffer";

/**
 * Stdio implementation for Node.js
 * Simply wrap Node.js's `process.stdin` and `process.stdout` to follow StdioInterface
 */
export class NodeStdio implements StdioInterface {
  private readStream: Readable;
  private writeStream: Writable;
  private dataHandler: ((chunk: Buffer) => void) | null = null;
  private errorHandler: ((error: Error) => void) | null = null;

  constructor(readStream: Readable, writeStream: Writable) {
    this.readStream = readStream;
    this.writeStream = writeStream;

    // Set up persistent listeners
    this.readStream.on("error", (error) => {
      if (this.errorHandler) this.errorHandler(error);
    });
  }

  async read(): Promise<Buffer | null> {
    return new Promise((resolve, reject) => {
      const onData = (chunk: Buffer) => {
        cleanup();
        resolve(chunk);
      };

      const onEnd = () => {
        cleanup();
        resolve(null);
      };

      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };

      const cleanup = () => {
        this.readStream.removeListener("data", onData);
        this.readStream.removeListener("end", onEnd);
        this.readStream.removeListener("error", onError);
      };

      this.readStream.once("data", onData);
      this.readStream.once("end", onEnd);
      this.readStream.once("error", onError);
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
