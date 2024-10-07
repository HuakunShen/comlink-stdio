// worker.ts
import { Serializer, type Message, type Response } from "./serialization";

type Methods<T> = {
  [K in keyof T]: (...args: any[]) => Promise<any>;
};

export class Worker<T> {
  private methods: Methods<T>;

  constructor(methods: Methods<T>) {
    this.methods = methods;
    this.listen();
  }

  // Listen for incoming messages on stdin
  private listen() {
    process.stdin.on("data", (data) => {
      const message = Serializer.deserialize(data.toString()) as Message;

      if (message.method in this.methods) {
        this.methods[message.method as keyof T](...message.args)
          .then((result) => {
            const response: Response = { id: message.id, result };
            process.stdout.write(Serializer.serializeResponse(response) + "\n");
          })
          .catch((error) => {
            const response: Response = { id: message.id, error: error.message };
            process.stdout.write(Serializer.serializeResponse(response) + "\n");
          });
      } else {
        const response: Response = {
          id: message.id,
          error: "Method not found",
        };
        process.stdout.write(Serializer.serializeResponse(response) + "\n");
      }
    });
  }
}
