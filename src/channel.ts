// RPCChannel.ts
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

interface CallbackFunction {
  (...args: any[]): void;
}

/**
 * A bidirectional Stdio IPC channel in RPC style.
 * This allows 2 JS/TS processes to call each other's API like using libraries in RPC style,
 * without needing to deal with `argv`, `stdin`, `stdout` directly.
 */
export class RPCChannel<LocalAPI extends {}, RemoteAPI extends {}> {
  private pendingRequests: Record<string, PendingRequest> = {};
  private callbacks: Record<string, CallbackFunction> = {};
  private callbackCache: Map<CallbackFunction, string> = new Map();
  private messageStr = "";

  constructor(
    private io: StdioInterface,
    private apiImplementation: LocalAPI
  ) {
    this.listen();
  }

  private async listen(): Promise<void> {
    while (true) {
      const buffer = await this.io.read();
      if (!buffer) {
        continue;
      }
      if (!buffer) {
        return;
      }
      this.messageStr += buffer.toString("utf-8");
      const lastChar = this.messageStr[this.messageStr.length - 1];
      const msgsSplit = this.messageStr.split("\n");
      let msgs = lastChar === "\n" ? msgsSplit : msgsSplit.slice(0, -1); // remove the last incomplete message
      this.messageStr = lastChar === "\n" ? "" : msgsSplit.at(-1) ?? "";

      for (const msgStr of msgs.map((msg) => msg.trim()).filter(Boolean)) {
        this.handleMessageStr(msgStr);
      }
    }
  }

  private async handleMessageStr(messageStr: string): Promise<void> {
    const parsedMessage = await deserializeMessage(messageStr);
    if (parsedMessage.type === "response") {
      this.handleResponse(parsedMessage as Message<Response<any>>);
    } else if (parsedMessage.type === "request") {
      this.handleRequest(parsedMessage);
    } else if (parsedMessage.type === "callback") {
      this.handleCallback(parsedMessage);
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
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const messageId = generateUUID();
      this.pendingRequests[messageId] = { resolve, reject };

      const callbackIds: string[] = [];
      const processedArgs = args.map((arg) => {
        if (typeof arg === "function") {
          let callbackId = this.callbackCache.get(arg);
          if (!callbackId) {
            callbackId = generateUUID();
            this.callbacks[callbackId] = arg;
            // console.log("callbacks size", Object.keys(this.callbacks).length);
            this.callbackCache.set(arg, callbackId);
          } else {
            //   console.log("callbackId already exists", callbackId);
          }
          callbackIds.push(callbackId);
          return `__callback__${callbackId}`;
        }
        return arg;
      });

      const message: Message = {
        id: messageId,
        method: method as string,
        args: processedArgs,
        type: "request",
        callbackIds: callbackIds.length > 0 ? callbackIds : undefined,
      };
      this.io.write(serializeMessage(message));
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
    const { id, method, args, callbackIds } = request;
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

    const processedArgs = args.map((arg: any, index: number) => {
      if (typeof arg === "string" && arg.startsWith("__callback__")) {
        const callbackId = arg.slice(12);
        return (...callbackArgs: any[]) => {
          this.invokeCallback(callbackId, callbackArgs);
        };
      }
      return arg;
    });

    try {
      const result = (apiProxy[method as keyof LocalAPI] as Function).apply(
        apiProxy,
        processedArgs
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

  private invokeCallback(callbackId: string, args: any[]): void {
    const message: Message = {
      id: generateUUID(),
      method: callbackId,
      args,
      type: "callback",
    };
    this.io.write(serializeMessage(message));
  }

  private handleCallback(message: Message): void {
    const { method: callbackId, args } = message;
    const callback = this.callbacks[callbackId];
    if (callback) {
      callback(...args);
      // delete this.callbacks[callbackId];
      // console.log("callback size", Object.keys(this.callbacks).length);
      // this.cleanupCallbacks();
    } else {
      console.error(`Callback with id ${callbackId} not found`);
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
    this.io.write(serializeMessage(response));
  }

  // Send an error response
  private sendError(id: string, error: string): void {
    const response: Message<Response<null>> = {
      id,
      method: "",
      args: { error },
      type: "response",
    };
    this.io.write(serializeMessage(response));
  }

  public getApi(): RemoteAPI {
    return new Proxy({} as RemoteAPI, {
      get:
        (_, method: string) =>
        (...args: unknown[]) => {
          return this.callMethod(method as keyof RemoteAPI, args);
        },
    });
  }

  /**
   * Free up the callback map and cache
   * If you use callbacks a lot, you could get memory leak.
   * e.g. If you use anonymous callback function in a 5000 iterations loop,
   * you will get 5000 callbacks in cache. It's a better idea to free them.
   *
   * If you use a named callback function, there will be only one entry in the cache.
   */
  freeCallbacks() {
    this.callbacks = {};
    this.callbackCache.clear();
  }

  // Add a new method to clean up callbacks that are no longer needed
  // private cleanupCallbacks(): void {
  //   // console.log("cleanupCallbacks");
  //   for (const [func, id] of this.callbackCache.entries()) {
  //     if (!this.callbacks[id]) {
  //       this.callbackCache.delete(func);
  //     }
  //   }
  // }
}
