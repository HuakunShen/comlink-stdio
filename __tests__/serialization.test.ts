import { expect, test, describe } from "bun:test";
import { Serializer, type Message } from "../src/serialization";

describe("Serializer", () => {
  test("should serialize and deserialize a message", () => {
    const message: Message = {
      id: 1,
      method: "testMethod",
      args: [1, 2, 3],
      type: "request",
    };
    const serialized = Serializer.serialize(message);
    const deserialized = Serializer.deserialize(serialized);
    expect(deserialized).toEqual(message);
  });

  test("should serialize and deserialize a response", () => {
    const response = {
      id: 1,
    };
    const serializedResponse = Serializer.serializeResponse(response);
    const deserializedResponse =
      Serializer.deserializeResponse(serializedResponse);
    expect(deserializedResponse).toEqual(response);
  });
});
