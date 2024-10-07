// serialization.ts
export interface Message<T = any> {
  id: number;
  method: string;
  args: T;
  type: "request" | "response"; // Add a type field to differentiate requests and responses
}

export interface Response<T = any> {
  id: number;
  result?: T;
  error?: string;
}

export class Serializer {
  // Serialize a message
  static serialize<T>(message: Message<T>): string {
    return JSON.stringify(message);
  }

  // Deserialize a message
  static deserialize<T>(message: string): Message<T> {
    return JSON.parse(message);
  }

  // Serialize a response
  static serializeResponse<T>(response: Response<T>): string {
    return JSON.stringify(response);
  }

  // Deserialize a response
  static deserializeResponse<T>(response: string): Response<T> {
    return JSON.parse(response);
  }
}
