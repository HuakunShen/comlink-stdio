// serialization.ts
export interface Message<T = any> {
  id: number;
  method: string;
  args: T;
  type: "request" | "response"; // Add a type field to differentiate requests and responses
}

export interface Response<T = any> {
  result?: T;
  error?: string;
}

// Serialize a message
export function serializeMessage<T>(message: Message<T>): string {
  return JSON.stringify(message);
}

// Deserialize a message
export function deserializeMessage<T>(message: string): Message<T> {
  return JSON.parse(message);
}

// Serialize a response
export function serializeResponse<T>(response: Response<T>): string {
  return JSON.stringify(response);
}

// Deserialize a response
export function deserializeResponse<T>(response: string): Response<T> {
  return JSON.parse(response);
}
