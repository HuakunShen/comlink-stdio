// client.ts
import { spawn, ChildProcess } from "child_process";
import { type API } from "./src/api";

class WorkerClient {
  private worker: ChildProcess;
  private pendingRequests: Record<number, PendingRequest> = {};
  private id = Math.floor(Math.random() * 1000000);

  constructor(scriptPath: string) {
    this.worker = spawn("bun", [scriptPath]);
    this.setupWorkerCommunication();
  }

  private setupWorkerCommunication() {
    this.worker.stdout?.on("data", (data) => {
      const messages = data.toString().split("\n").filter(Boolean);
      for (const message of messages) {
        const response = JSON.parse(message);
        const { id, result, error } = response;
        if (this.pendingRequests[id]) {
          if (error) {
            this.pendingRequests[id].reject(new Error(error));
          } else {
            this.pendingRequests[id].resolve(result);
          }
          delete this.pendingRequests[id];
        }
      }
    });
  }

  private callMethod<T extends keyof API>(
    method: T,
    args: Parameters<API[T]>
  ): ReturnType<API[T]> {
    return new Promise((resolve, reject) => {
      const messageId = this.id++;
      this.pendingRequests[messageId] = { resolve, reject };
      this.worker.stdin?.write(
        JSON.stringify({ id: messageId, method, args }) + "\n"
      );
    }) as ReturnType<API[T]>;
  }

  public getApi(): API {
    return new Proxy({} as API, {
      get:
        (_, method: string) =>
        (...args: any[]) =>
          this.callMethod(method as keyof API, args as any),
    });
  }

  public close() {
    this.worker.kill();
  }
}

interface PendingRequest {
  resolve: (result: any) => void;
  reject: (error: any) => void;
}

// Example usage
(async () => {
  const workerClient = new WorkerClient("runWorker.ts");
  const api = workerClient.getApi();

  try {
    const sum = await api.add(2, 3);
    console.log("Sum:", sum); // Output: Sum: 5

    const difference = await api.subtract(5, 3);
    console.log("Difference:", difference); // Output: Difference: 2
  } catch (error) {
    console.error("Error:", error);
  } finally {
    workerClient.close();
  }
})();
