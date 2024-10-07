export interface StdioInterface {
  read(): Promise<Buffer | Uint8Array | null>; // Reads input
  write(data: string): Promise<void>; // Writes output
}
