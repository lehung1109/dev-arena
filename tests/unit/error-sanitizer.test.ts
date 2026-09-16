import { describe, it, expect } from "vitest";
import { sanitizeStackTrace } from "@/lib/runner/error-sanitizer";

describe("Error Stack Trace Sanitizer Unit Tests (TDD)", () => {
  it("strips internal worker, runner manager, and node runtime frames from stack traces", () => {
    const rawStack = `TypeError: Cannot read properties of undefined (reading 'length')
    at twoSum (<anonymous>:3:18)
    at Object.runUserCode (F:\\projects\\dev-arena\\src\\lib\\runner\\execute.ts:45:12)
    at WorkerRunnerManager.runWithVmFallback (F:\\projects\\dev-arena\\src\\lib\\runner\\WorkerRunnerManager.ts:250:10)
    at async WorkerRunnerManager.runCode (F:\\projects\\dev-arena\\src\\lib\\runner\\WorkerRunnerManager.ts:89:14)
    at runInContext (node:vm:295:10)
    at node:internal/process/task_queues:95:5`;

    const err = new TypeError("Cannot read properties of undefined (reading 'length')");
    err.stack = rawStack;

    const result = sanitizeStackTrace(err, 0);

    expect(result.message).toBe("Cannot read properties of undefined (reading 'length')");
    expect(result.line).toBe(3);
    expect(result.column).toBe(18);
    expect(result.cleanStack).toContain("at twoSum");
    expect(result.cleanStack).not.toContain("WorkerRunnerManager.ts");
    expect(result.cleanStack).not.toContain("execute.ts");
    expect(result.cleanStack).not.toContain("node:internal");
    expect(result.cleanStack).not.toContain("node:vm");
  });

  it("extracts accurate user code line numbers and column numbers with codeWrapperOffsetLines", () => {
    // If the wrapper added 2 lines at the top ("use strict";\nfunction ...),
    // line 5 in the VM/eval corresponds to line 3 in the user's editor.
    const rawStack = `ReferenceError: myVar is not defined
    at twoSum (<anonymous>:5:14)
    at execute.ts:35:10`;

    const err = new ReferenceError("myVar is not defined");
    err.stack = rawStack;

    const result = sanitizeStackTrace(err, 2);

    expect(result.message).toBe("myVar is not defined");
    expect(result.line).toBe(3); // 5 - 2 = 3
    expect(result.column).toBe(14);
    expect(result.cleanStack).toContain("ReferenceError: myVar is not defined");
    expect(result.cleanStack).toContain("at twoSum");
    expect(result.cleanStack).not.toContain("execute.ts");
  });

  it("handles anonymous user functions correctly", () => {
    const rawStack = `Error: Something went wrong
    at <anonymous>:4:9
    at runner.worker.ts:15:3`;

    const err = new Error("Something went wrong");
    err.stack = rawStack;

    const result = sanitizeStackTrace(err, 1);

    expect(result.message).toBe("Something went wrong");
    expect(result.line).toBe(3); // 4 - 1 = 3
    expect(result.column).toBe(9);
    expect(result.cleanStack).toContain("<anonymous>");
    expect(result.cleanStack).not.toContain("runner.worker.ts");
  });

  it("handles SyntaxErrors with location metadata in message or stack", () => {
    const rawStack = `SyntaxError: Unexpected token '}' (4:12)
    at new Function (<anonymous>)
    at execute.ts:30:21`;

    const err = new SyntaxError("Unexpected token '}' (4:12)");
    err.stack = rawStack;

    const result = sanitizeStackTrace(err, 1);

    expect(result.message).toContain("Unexpected token '}'");
    expect(result.line).toBe(3); // 4 - 1 = 3
    expect(result.column).toBe(12);
    expect(result.cleanStack).not.toContain("execute.ts");
  });

  it("handles raw string errors safely without crashing", () => {
    const rawError = "Error: Unhandled rejection in user algorithm\n    at helper (<anonymous>:7:20)\n    at execute.ts:50:5";
    const result = sanitizeStackTrace(rawError, 0);

    expect(result.message).toBe("Unhandled rejection in user algorithm");
    expect(result.line).toBe(7);
    expect(result.column).toBe(20);
    expect(result.cleanStack).toContain("at helper");
    expect(result.cleanStack).not.toContain("execute.ts");
  });

  it("handles simple string messages without stack traces", () => {
    const result = sanitizeStackTrace("Time limit exceeded");

    expect(result.message).toBe("Time limit exceeded");
    expect(result.line).toBeUndefined();
    expect(result.column).toBeUndefined();
    expect(result.cleanStack).toBe("Error: Time limit exceeded");
  });
});
