import type { StdioInterface } from "./interface.ts";
import { Buffer } from "node:buffer";

/**
 * Stdio implementation for Deno
 * Deno doesn't have `process` object, and have a completely different stdio API,
 * This implementation wrap Deno's `Deno.stdin` and `Deno.stdout` to follow StdioInterface
 */
export class DenoStdio implements StdioInterface {
  private reader: ReadableStreamDefaultReader<Uint8Array>;

  constructor(
    private readStream: ReadableStream<Uint8Array>,
    private writeStream: WritableStream<Uint8Array>
  ) {
    this.reader = this.readStream.getReader();
    const writer = this.writeStream.getWriter();
    const encoder = new TextEncoder();

    // writer.write(encoder.encode("hello"))
  }

  async read(): Promise<Buffer | null> {
    const { value, done } = await this.reader.read();
    if (done) {
      return null; // End of input
    }
    return Buffer.from(value);
  }

  async write(data: string): Promise<void> {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data + "\n");
    Deno.stdout.writeSync(encodedData);
  }
}
