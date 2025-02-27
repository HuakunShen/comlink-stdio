import { expect, test, describe } from "bun:test";
import {
  serializeMessage,
  serializeResponse,
  deserializeMessage,
  deserializeResponse,
  type Message,
} from "../src/serialization";

describe("Serializer", () => {
  test("should serialize and deserialize a message", async () => {
    const message: Message = {
      id: "1",
      method: "testMethod",
      args: [1, 2, 3],
      type: "request",
    };
    const serialized = serializeMessage(message);
    const deserialized = await deserializeMessage(serialized);
    expect(deserialized).toEqual(message as any);
  });

  test("should serialize and deserialize a response", async () => {
    const response = {
      id: 1,
    };
    const serializedResponse = serializeResponse(response as any);
    const deserializedResponse = await deserializeResponse(serializedResponse);
    expect(deserializedResponse).toEqual(response as any);
  });
});
