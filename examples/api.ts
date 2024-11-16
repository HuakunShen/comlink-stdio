// api.ts
export interface API {
  add(a: number, b: number): Promise<number>;
  math: {
    add(
      a: number,
      b: number,
      callback: (result: number) => void
    ): Promise<number>;
  };
  subtract(a: number, b: number): Promise<number>;
  addCallback(a: number, b: number, callback: (result: number) => void): void;
}

// Define your API methods
export const apiMethods: API = {
  add: async (a: number, b: number) => a + b,
  math: {
    add: async (a: number, b: number, callback) => {
      callback(a + b);
      return a + b;
    },
  },
  subtract: async (a: number, b: number) => a - b,
  addCallback: async (
    a: number,
    b: number,
    callback: (result: number) => void
  ) => {
    callback(a + b);
  },
};
