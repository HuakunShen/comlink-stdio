import { type Buffer } from "node:buffer";

export interface StdioInterface {
  read(): Promise<Buffer | Uint8Array | string | null>; // Reads input
  write(data: string): Promise<void>; // Writes output
}
