import type { StdioInterface } from "./stdio";

export class DenoStdio implements StdioInterface {
  async read(): Promise<Uint8Array | null> {
    const buffer = new Uint8Array(1024);
    const bytesRead = await Deno.stdin.read(buffer);
    if (bytesRead === null) {
      return null; // End of input
    }
    return buffer.subarray(0, bytesRead);
  }

  async write(data: string): Promise<void> {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    await Deno.stdout.write(encodedData);
  }
}
