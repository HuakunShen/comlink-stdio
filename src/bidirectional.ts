// processChannel.ts
import {
  serializeMessage,
  deserializeMessage,
  serializeResponse,
  deserializeResponse,
  type Message,
  type Response,
} from "./serialization";
// import { type API } from "./api";

interface PendingRequest {
  resolve: (result: any) => void;
  reject: (error: any) => void;
}

export class ProcessChannel<LocalAPI extends {}, RemoteAPI extends {}> {
  private idCounter = 0;
  private pendingRequests: Record<number, PendingRequest> = {};

  constructor(
    private input: NodeJS.ReadableStream,
    private output: NodeJS.WritableStream,
    private apiImplementation: LocalAPI
  ) {
    this.input.on("data", this.handleIncomingMessage.bind(this));
  }

  // Send a method call to the other process
  public callMethod<T extends keyof RemoteAPI>(
    method: T,
    args: any[]
    // ...args: Parameters<API[T] extends (...args: any) => any ? API[T] : never>
  ) {
    return new Promise((resolve, reject) => {
      const messageId = this.idCounter++;
      this.pendingRequests[messageId] = { resolve, reject };

      const message: Message = {
        id: messageId,
        method: method as string,
        args,
        type: "request",
      };

      this.output.write(serializeMessage(message) + "\n");
    });
  }

  // Handle incoming messages (both requests and responses)
  private handleIncomingMessage(data: Buffer): void {
    const messages = data.toString().split("\n").filter(Boolean);
    for (const message of messages) {
      const parsedMessage: Message<unknown> = deserializeMessage(message);

      if (parsedMessage.type === "response") {
        // Handle response
        this.handleResponse(parsedMessage as Message<Response<any>>);
      } else if (parsedMessage.type === "request") {
        // Handle request
        this.handleRequest(parsedMessage);
      }
    }
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
        .then((res) => this.sendResponse(id, res))
        .catch((err) => this.sendError(id, err.message));
    } catch (error: any) {
      this.sendError(id, error.message ?? error.toString());
    }
  }

  // Send a response to a request
  private sendResponse<T>(id: number, result: T): void {
    const response: Message<Response<T>> = {
      id,
      method: "",
      args: { result },
      type: "response",
    };
    this.output.write(serializeMessage(response) + "\n");
  }

  // Send an error response
  private sendError(id: number, error: string): void {
    const response: Message<Response<null>> = {
      id,
      method: "",
      args: { error },
      type: "response",
    };
    this.output.write(serializeMessage(response) + "\n");
  }

  public getApi(): RemoteAPI {
    return new Proxy({} as RemoteAPI, {
      get:
        (_, method: string) =>
        (...args: unknown[]) =>
          this.callMethod(method as keyof RemoteAPI, args),
    });
  }
}
