// StdioRPCChannel.ts
import {
  serializeMessage,
  deserializeMessage,
  serializeResponse,
  deserializeResponse,
  type Message,
  type Response,
} from "./serialization.ts";
import type { StdioInterface } from "./stdio/interface.ts";
import { generateUUID } from "./utils.ts";

interface PendingRequest {
  resolve: (result: any) => void;
  reject: (error: any) => void;
}

/**
 * A bidirectional Stdio IPC channel in RPC style.
 * This allows 2 JS/TS processes to call each other's API like using libraries in RPC style,
 * without needing to deal with `argv`, `stdin`, `stdout` directly.
 */
export class StdioRPCChannel<LocalAPI extends {}, RemoteAPI extends {}> {
  private pendingRequests: Record<string, PendingRequest> = {};

  constructor(
    private stdio: StdioInterface,
    private apiImplementation: LocalAPI
  ) {
    this.listen();
  }

  private async listen(): Promise<void> {
    while (true) {
      const buffer = await this.stdio.read();
      if (!buffer) {
        continue;
      }
      if (!buffer) {
        return;
      }
      const messageStr = buffer.toString("utf-8");
      if (messageStr.includes("\n")) {
        const msgStrs = messageStr
          .split("\n")
          .map((msg) => msg.trim())
          .filter(Boolean);

        for (const msgStr of msgStrs) {
          this.handleMessageStr(msgStr);
        }
      } else {
        if (messageStr.trim()) {
          this.handleMessageStr(messageStr.trim());
        }
      }
    }
  }

  private async handleMessageStr(messageStr: string): Promise<void> {
    const parsedMessage = await deserializeMessage(messageStr);
    if (parsedMessage.type === "response") {
      // Handle response
      this.handleResponse(parsedMessage as Message<Response<any>>);
    } else if (parsedMessage.type === "request") {
      this.handleRequest(parsedMessage);
    } else {
      console.error(
        "received unknown message type",
        parsedMessage,
        typeof parsedMessage
      );
    }
  }

  // Send a method call to the other process
  public callMethod<T extends keyof RemoteAPI>(
    method: T,
    args: any[]
    // ...args: Parameters<API[T] extends (...args: any) => any ? API[T] : never>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const messageId = generateUUID();
      this.pendingRequests[messageId] = { resolve, reject };

      const message: Message = {
        id: messageId,
        method: method as string,
        args,
        type: "request",
      };
      //   this.output.write(serializeMessage(message) + "\n");
      this.stdio.write(serializeMessage(message));
    });
  }

  // Handle response to a request we sent
  private handleResponse(response: Message<Response<any>>): void {
    const { id } = response;
    const { result, error } = response.args;
    if (this.pendingRequests[id]) {
      if (error) {
        this.pendingRequests[id].reject(new Error(error));
      } else {
        this.pendingRequests[id].resolve(result);
      }
      delete this.pendingRequests[id];
    }
  }

  // Handle incoming requests from the other process using a Proxy
  private handleRequest(request: Message): void {
    const { id, method, args } = request;
    const apiProxy = new Proxy(this.apiImplementation, {
      get: (target, prop: string) => {
        if (typeof target[prop as keyof LocalAPI] === "function") {
          return (...args: unknown[]) =>
            (target[prop as keyof LocalAPI] as Function)(...args);
        } else {
          throw new Error(`Method ${prop} not found`);
        }
      },
    });

    try {
      //   const result = apiProxy[method as keyof API](...args);
      const result = (apiProxy[method as keyof LocalAPI] as Function).apply(
        apiProxy,
        args
      );

      Promise.resolve(result)
        .then((res) => {
          return this.sendResponse(id, res);
        })
        .catch((err) => this.sendError(id, err.message));
    } catch (error: any) {
      this.sendError(id, error.message ?? error.toString());
    }
  }

  // Send a response to a request
  private sendResponse<T>(id: string, result: T): void {
    const response: Message<Response<T>> = {
      id,
      method: "",
      args: { result },
      type: "response",
    };
    this.stdio.write(serializeMessage(response));
  }

  // Send an error response
  private sendError(id: string, error: string): void {
    const response: Message<Response<null>> = {
      id,
      method: "",
      args: { error },
      type: "response",
    };
    this.stdio.write(serializeMessage(response));
  }

  public getApi(): RemoteAPI {
    return new Proxy({} as RemoteAPI, {
      get:
        (_, method: string) =>
        (...args: unknown[]) => {
          //   console.log("getApi", method, args);
          return this.callMethod(method as keyof RemoteAPI, args);
        },
    });
  }
}
