import type { StdioInterface } from "./stdio";

export class NodeStdio implements StdioInterface {
  async read(): Promise<Buffer | null> {
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      process.stdin.on("data", (chunk) => {
        chunks.push(chunk);
      });
      process.stdin.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      process.stdin.on("error", reject);
    });
  }

  async write(data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      process.stdout.write(data, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
