import { isDeno, isNode } from "./env";
import { Serializer, type Message, type Response } from "./serialization";

interface PendingRequest {
  resolve: (result: any) => void;
  reject: (error: any) => void;
}

export class BidirectionalChannel<LocalAPI, RemoteAPI> {
  private methods: LocalAPI; // Local API methods
  private id: number;
  private pendingRequests: Record<number, PendingRequest>;

  constructor(methods: LocalAPI) {
    this.methods = methods;
    this.id = 0;
    this.pendingRequests = {};
    this.listen();
  }

  // Listen to stdin for incoming requests or responses
  private async listen() {
    const decoder = new TextDecoder();
    if (isNode) {
      // For Node.js
      process.stdin.on("data", (data: Buffer) => {
        const messages = data.toString().split("\n").filter(Boolean);
        for (const message of messages) {
          this.handleMessage(message);
        }
      });
    } else if (isDeno) {
      // For Deno
      const reader = Deno.stdin.readable.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const messages = decoder.decode(value).split("\n").filter(Boolean);
        for (const message of messages) {
          this.handleMessage(message);
        }
      }
    }
  }

  // Handle incoming messages (requests or responses)
  private handleMessage(message: string) {
    const parsedMessage = Serializer.deserialize(message);
    if (parsedMessage.type === "request") {
      this.handleRequest(parsedMessage);
    } else if (parsedMessage.type === "response") {
      this.handleResponse(parsedMessage);
    }
  }

  // Handle incoming requests
  private handleRequest(message: Message) {
    const { method, args, id } = message;

    if (method in this.methods) {
      (this.methods as any)
        [method](...args)
        .then((result: any) => {
          this.sendResponse({ id, result });
        })
        .catch((error: any) => {
          this.sendResponse({ id, error: error.message });
        });
    } else {
      this.sendResponse({ id, error: "Method not found" });
    }
  }

  // Handle responses to outgoing requests
  private handleResponse(message: Response) {
    const { id, result, error } = message;
    if (this.pendingRequests[id]) {
      if (error) {
        this.pendingRequests[id].reject(new Error(error));
      } else {
        this.pendingRequests[id].resolve(result);
      }
      delete this.pendingRequests[id];
    }
  }

  // Send a response
  private async sendResponse(response: Response) {
    const message = Serializer.serializeResponse(response) + "\n";
    if (isNode) {
      process.stdout.write(message);
    } else if (isDeno) {
      const encoder = new TextEncoder();
      await Deno.stdout.write(encoder.encode(message));
    }
  }

  // Send a method call to the other side
  callMethod<T extends keyof RemoteAPI>(
    method: T,
    args: Parameters<RemoteAPI[T]>
  ): ReturnType<RemoteAPI[T]> {
    return new Promise((resolve, reject) => {
      const messageId = this.id++;
      this.pendingRequests[messageId] = { resolve, reject };

      const message: Message = {
        id: messageId,
        method: method as string,
        args,
        type: "request",
      };
      this.sendMessage(message);
    }) as ReturnType<RemoteAPI[T]>;
  }

  // Send a request message
  private async sendMessage(message: Message) {
    const encoder = new TextEncoder();
    const serializedMessage = Serializer.serialize(message) + "\n";
    if (isNode) {
      process.stdout.write(serializedMessage);
    } else if (isDeno) {
      await Deno.stdout.write(encoder.encode(serializedMessage));
    }
  }

  // Create a proxy for remote API
  createRemoteProxy(): RemoteAPI {
    return new Proxy({} as RemoteAPI, {
      get: (_, method: string) => {
        return (...args: any[]) =>
          this.callMethod(method as keyof RemoteAPI, args);
      },
    });
  }
}
