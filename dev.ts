type NestedProxyHandler = (chain: string[], args?: any[]) => any;

function createNestedProxy(
  handler: NestedProxyHandler,
  chain: string[] = []
): any {
  return new Proxy(() => {}, {
    get(_target, prop: string | symbol) {
      console.log("chain", chain, "prop", prop);
      // Prevent special properties like `toString` or `then` from being treated as part of the chain
      if (typeof prop === "string" && prop !== "then") {
        return createNestedProxy(handler, [...chain, prop]);
      }
      return undefined;
    },
    apply(_target, _thisArg, args: any[]) {
      console.log("apply chain", chain, "args", args);
      // Invoke the handler when a method call is detected
      return handler(chain, args);
    },
  });
}

// Example handler
const handler: NestedProxyHandler = (chain, args) => {
  console.log("chain", chain);

  console.log(`Method called: ${chain.join(".")}`);
  console.log("Arguments:", args);
  return `Result from ${chain.join(".")}`;
};

// Create the proxy
const proxy = createNestedProxy(handler);

// Usage
const result = proxy.math.calculus.derivative(2, "x");

// Logs:
// Method called: math.calculus.derivative
// Arguments: [ 2, 'x' ]

console.log("result", result); // Output: Result from math.calculus.derivative
