import type { StdioInterface } from "../src/stdio/stdio.ts";
import { Buffer } from "node:buffer";

export class DenoStdio implements StdioInterface {
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private writer: WritableStreamDefaultWriter<Uint8Array>;

  constructor(
    private readStream: ReadableStream<Uint8Array>,
    private writeStream: WritableStream<Uint8Array>
  ) {
    this.reader = this.readStream.getReader();
    this.writer = this.writeStream.getWriter();
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
    const encodedData = encoder.encode(data);
    await this.writer.write(encodedData);
  }
}
