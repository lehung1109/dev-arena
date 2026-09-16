import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { WorkerRunnerManager } from "@/lib/runner/WorkerRunnerManager";
import type { RunCodeRequest } from "@/types/runner";

describe("WorkerRunnerManager Unit Tests", () => {
  let runnerManager: WorkerRunnerManager;

  beforeEach(() => {
    runnerManager = new WorkerRunnerManager();
  });

  afterEach(() => {
    runnerManager.dispose();
  });

  it("successfully executes correct code and returns ACCEPTED verdict", async () => {
    const request: RunCodeRequest = {
      action: "RUN",
      functionName: "twoSum",
      code: `
        function twoSum(nums, target) {
          const map = new Map();
          for (let i = 0; i < nums.length; i++) {
            const diff = target - nums[i];
            if (map.has(diff)) {
              return [map.get(diff), i];
            }
            map.set(nums[i], i);
          }
          return [];
        }
      `,
      testCases: [
        {
          id: "tc-1",
          input: [[2, 7, 11, 15], 9],
          expectedOutput: [0, 1],
          isPublic: true,
          orderIndex: 0,
        },
        {
          id: "tc-2",
          input: [[3, 2, 4], 6],
          expectedOutput: [1, 2],
          isPublic: true,
          orderIndex: 1,
        },
      ],
    };

    const response = await runnerManager.runCode(request);

    expect(response.action).toBe("RUN");
    expect(response.verdict).toBe("ACCEPTED");
    expect(response.totalTestsCount).toBe(2);
    expect(response.passedTestsCount).toBe(2);
    expect(response.results).toHaveLength(2);
    expect(response.results[0].passed).toBe(true);
    expect(response.results[0].actualOutput).toEqual([0, 1]);
    expect(response.results[1].passed).toBe(true);
    expect(response.results[1].actualOutput).toEqual([1, 2]);
    expect(response.totalDurationMs).toBeGreaterThanOrEqual(0);
  });

  it("handles wrong answers correctly and returns WRONG_ANSWER verdict", async () => {
    const request: RunCodeRequest = {
      action: "RUN",
      functionName: "twoSum",
      code: `
        function twoSum(nums, target) {
          return [0, 0];
        }
      `,
      testCases: [
        {
          id: "tc-1",
          input: [[2, 7, 11, 15], 9],
          expectedOutput: [0, 1],
          isPublic: true,
          orderIndex: 0,
        },
      ],
    };

    const response = await runnerManager.runCode(request);

    expect(response.verdict).toBe("WRONG_ANSWER");
    expect(response.passedTestsCount).toBe(0);
    expect(response.totalTestsCount).toBe(1);
    expect(response.results[0].passed).toBe(false);
    expect(response.results[0].actualOutput).toEqual([0, 0]);
  });

  it("captures console.log, console.warn, and console.error output", async () => {
    const request: RunCodeRequest = {
      action: "RUN",
      functionName: "solve",
      code: `
        function solve(x) {
          console.log("standard log", x);
          console.info("info log", 42);
          console.warn("warning log");
          return x * 2;
        }
      `,
      testCases: [
        {
          id: "tc-1",
          input: [5],
          expectedOutput: 10,
          isPublic: true,
          orderIndex: 0,
        },
      ],
    };

    const response = await runnerManager.runCode(request);

    expect(response.verdict).toBe("ACCEPTED");
    expect(response.results[0].logs.length).toBeGreaterThanOrEqual(3);
    expect(response.results[0].logs.some((l) => l.includes("standard log"))).toBe(true);
    expect(response.results[0].logs.some((l) => l.includes("info log"))).toBe(true);
    expect(response.results[0].logs.some((l) => l.includes("warning log"))).toBe(true);
  });

  it("handles runtime errors gracefully and returns RUNTIME_ERROR verdict", async () => {
    const request: RunCodeRequest = {
      action: "RUN",
      functionName: "brokenFunction",
      code: `
        function brokenFunction(arr) {
          const x = null;
          return x.nonExistentMethod();
        }
      `,
      testCases: [
        {
          id: "tc-1",
          input: [[1, 2]],
          expectedOutput: 1,
          isPublic: true,
          orderIndex: 0,
        },
      ],
    };

    const response = await runnerManager.runCode(request);

    expect(response.verdict).toBe("RUNTIME_ERROR");
    expect(response.passedTestsCount).toBe(0);
    expect(response.results[0].passed).toBe(false);
    expect(response.results[0].error).toBeDefined();
    expect(response.results[0].error?.message).toMatch(/cannot read|nonExistentMethod|null/i);
  });

  it("handles syntax errors and returns SYNTAX_ERROR verdict", async () => {
    const request: RunCodeRequest = {
      action: "RUN",
      functionName: "syntaxErrorFn",
      code: `
        function syntaxErrorFn() {
          const var = ;
        }
      `,
      testCases: [
        {
          id: "tc-1",
          input: [],
          expectedOutput: null,
          isPublic: true,
          orderIndex: 0,
        },
      ],
    };

    const response = await runnerManager.runCode(request);

    expect(response.verdict).toBe("SYNTAX_ERROR");
    expect(response.passedTestsCount).toBe(0);
  });

  it("terminates infinite loops and aborts with TIME_LIMIT_EXCEEDED within timeout", async () => {
    const request: RunCodeRequest = {
      action: "RUN",
      functionName: "infiniteLoop",
      code: `
        function infiniteLoop() {
          while (true) {}
        }
      `,
      testCases: [
        {
          id: "tc-1",
          input: [],
          expectedOutput: 1,
          isPublic: true,
          orderIndex: 0,
        },
      ],
      timeoutMs: 250, // Short timeout for unit test efficiency
    };

    const startTime = Date.now();
    const response = await runnerManager.runCode(request);
    const elapsed = Date.now() - startTime;

    expect(response.verdict).toBe("TIME_LIMIT_EXCEEDED");
    expect(response.passedTestsCount).toBe(0);
    expect(response.results[0].passed).toBe(false);
    expect(response.results[0].error?.message).toMatch(/time limit exceeded/i);
    // Verified cutoff around ~250ms (with reasonable buffer)
    expect(elapsed).toBeLessThan(1500);
  });

  it("emits progress events during execution", async () => {
    const events: string[] = [];
    runnerManager.onEvent((event) => {
      events.push(event.type);
    });

    const request: RunCodeRequest = {
      action: "RUN",
      functionName: "add",
      code: `function add(a, b) { return a + b; }`,
      testCases: [
        { id: "1", input: [1, 2], expectedOutput: 3, isPublic: true, orderIndex: 0 },
        { id: "2", input: [2, 3], expectedOutput: 5, isPublic: true, orderIndex: 1 },
      ],
    };

    await runnerManager.runCode(request);

    expect(events).toContain("STARTED");
    expect(events).toContain("COMPLETED");
  });
});
