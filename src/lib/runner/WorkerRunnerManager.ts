/**
 * In-Browser & Isolated Worker Runner Manager
 * Dev Arena - 001-in-browser-code-arena
 */

import type {
  RunCodeRequest,
  RunCodeResponse,
  WorkerRunnerEvent,
} from "@/types/runner";
import { executeUserCode } from "./execute";

export class WorkerRunnerManager {
  private worker: Worker | null = null;
  private eventListeners: Array<(event: WorkerRunnerEvent) => void> = [];
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {}

  /**
   * Subscribe to runner lifecycle events (STARTED, PROGRESS, COMPLETED, ERROR)
   */
  public onEvent(callback: (event: WorkerRunnerEvent) => void): () => void {
    this.eventListeners.push(callback);
    return () => {
      this.eventListeners = this.eventListeners.filter((cb) => cb !== callback);
    };
  }

  private emit(event: WorkerRunnerEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error("WorkerRunnerManager listener error:", err);
      }
    }
  }

  /**
   * Instantiates a sandboxed Web Worker.
   * Handles browser Webpack bundling (new URL) and Bun/Node runtimes.
   */
  private createWorker(): Worker {
    if (typeof Worker !== "undefined") {
      try {
        if (typeof window !== "undefined") {
          // Standard Next.js browser environment
          return new Worker(new URL("./runner.worker.ts", import.meta.url), {
            type: "module",
          });
        } else {
          // Bun or headless runtime environment
          return new Worker(
            new URL("./runner.worker.ts", import.meta.url).href,
            {
              type: "module",
            }
          );
        }
      } catch (err) {
        console.warn("Could not instantiate Web Worker by URL:", err);
      }
    }
    throw new Error("Worker environment not supported");
  }

  /**
   * Dispatches code execution to the Web Worker with strict timeout cutoff (default 2000ms).
   * Automatically terminates the worker thread if execution exceeds timeout.
   */
  public async runCode(request: RunCodeRequest): Promise<RunCodeResponse> {
    const timeoutMs = request.timeoutMs ?? 2000;
    this.emit({ type: "STARTED", totalTests: request.testCases.length });

    // In Node / Vitest test environments without DOM window, use the node:vm isolated runner fallback
    if (typeof window === "undefined" && typeof (globalThis as any).Worker === "undefined") {
      return this.runWithVmFallback(request, timeoutMs);
    }

    // In Bun test or browser environment, create and supervise sandboxed Web Worker
    return new Promise<RunCodeResponse>((resolve) => {
      let isSettled = false;

      try {
        this.worker = this.createWorker();
      } catch {
        // Fallback to node:vm if worker creation fails
        this.runWithVmFallback(request, timeoutMs).then(resolve);
        return;
      }

      const cleanup = () => {
        if (this.timeoutTimer) {
          clearTimeout(this.timeoutTimer);
          this.timeoutTimer = null;
        }
      };

      this.timeoutTimer = setTimeout(() => {
        if (isSettled) return;
        isSettled = true;
        cleanup();

        if (this.worker) {
          try {
            this.worker.terminate();
          } catch {
            // ignore
          }
          this.worker = null;
        }

        const tleResponse: RunCodeResponse = {
          action: request.action,
          verdict: "TIME_LIMIT_EXCEEDED",
          totalDurationMs: timeoutMs,
          passedTestsCount: 0,
          totalTestsCount: request.testCases.length,
          results: request.testCases.map((tc) => ({
            testCaseId: tc.id,
            passed: false,
            expectedOutput: tc.expectedOutput,
            logs: [],
            executionTimeMs: timeoutMs,
            error: {
              message: `Time Limit Exceeded: Execution took longer than ${timeoutMs}ms`,
            },
          })),
        };

        this.emit({ type: "COMPLETED", response: tleResponse });
        resolve(tleResponse);
      }, timeoutMs);

      this.worker.onmessage = (event: MessageEvent<RunCodeResponse>) => {
        if (isSettled) return;
        isSettled = true;
        cleanup();

        const response = event.data;
        this.emit({ type: "COMPLETED", response });
        resolve(response);
      };

      this.worker.onerror = (event: ErrorEvent) => {
        if (isSettled) return;
        isSettled = true;
        cleanup();

        const errResponse: RunCodeResponse = {
          action: request.action,
          verdict: "RUNTIME_ERROR",
          totalDurationMs: 0,
          passedTestsCount: 0,
          totalTestsCount: request.testCases.length,
          results: request.testCases.map((tc) => ({
            testCaseId: tc.id,
            passed: false,
            expectedOutput: tc.expectedOutput,
            logs: [],
            executionTimeMs: 0,
            error: {
              message: event.message || "Unknown worker runtime error",
            },
          })),
        };

        this.emit({ type: "ERROR", error: event.message });
        resolve(errResponse);
      };

      this.worker.postMessage(request);
    });
  }

  /**
   * Node / Vitest fallback runner using node:vm with hard execution timeout
   */
  private async runWithVmFallback(
    request: RunCodeRequest,
    timeoutMs: number
  ): Promise<RunCodeResponse> {
    const { deepEqual, formatValue } = await import("./deep-equal");
    const { action, code, functionName, testCases = [] } = request;
    const startTime = performance.now();

    try {
      const vm = await import("node:vm");
      const logs: string[] = [];

      const captureLog = (...args: unknown[]) => {
        try {
          logs.push(
            args
              .map((a) => (typeof a === "string" ? a : formatValue(a)))
              .join(" ")
          );
        } catch {
          logs.push(args.map((a) => String(a)).join(" "));
        }
      };

      const sandboxContext = vm.createContext({
        console: {
          log: captureLog,
          info: captureLog,
          warn: captureLog,
          error: captureLog,
        },
        performance,
        Map,
        Set,
        Array,
        Object,
        Math,
        JSON,
        Date,
        RegExp,
        String,
        Number,
        Boolean,
        BigInt,
        Promise,
      });

      // Check compilation & syntax
      let compileScript: any;
      try {
        compileScript = new vm.Script(
          `"use strict";\n${code}\n;if (typeof ${functionName} !== "function") { throw new TypeError("${functionName} is not a function or was not declared"); }\n${functionName};`
        );
      } catch (err: any) {
        const isSyntax =
          err instanceof SyntaxError ||
          err?.name === "SyntaxError" ||
          /syntax|unexpected token/i.test(err?.message || "");

        const errResp: RunCodeResponse = {
          action,
          verdict: isSyntax ? "SYNTAX_ERROR" : "RUNTIME_ERROR",
          totalDurationMs: Math.round(performance.now() - startTime),
          results: testCases.map((tc) => ({
            testCaseId: tc.id,
            passed: false,
            expectedOutput: tc.expectedOutput,
            logs: [],
            executionTimeMs: 0,
            error: { message: err?.message || String(err) },
          })),
          passedTestsCount: 0,
          totalTestsCount: testCases.length,
        };
        this.emit({ type: "COMPLETED", response: errResp });
        return errResp;
      }

      let targetFn: any;
      try {
        targetFn = compileScript.runInContext(sandboxContext, {
          timeout: timeoutMs,
        });
      } catch (err: any) {
        if (/timed out/i.test(err?.message || "")) {
          const tleResp: RunCodeResponse = {
            action,
            verdict: "TIME_LIMIT_EXCEEDED",
            totalDurationMs: timeoutMs,
            passedTestsCount: 0,
            totalTestsCount: testCases.length,
            results: testCases.map((tc) => ({
              testCaseId: tc.id,
              passed: false,
              expectedOutput: tc.expectedOutput,
              logs: [],
              executionTimeMs: timeoutMs,
              error: {
                message: `Time Limit Exceeded: Execution took longer than ${timeoutMs}ms`,
              },
            })),
          };
          this.emit({ type: "COMPLETED", response: tleResp });
          return tleResp;
        }

        const errResp: RunCodeResponse = {
          action,
          verdict: "RUNTIME_ERROR",
          totalDurationMs: 0,
          passedTestsCount: 0,
          totalTestsCount: testCases.length,
          results: testCases.map((tc) => ({
            testCaseId: tc.id,
            passed: false,
            expectedOutput: tc.expectedOutput,
            logs: [],
            executionTimeMs: 0,
            error: { message: err?.message || String(err) },
          })),
        };
        this.emit({ type: "COMPLETED", response: errResp });
        return errResp;
      }

      // Execute each test case
      const results: any[] = [];
      let passedCount = 0;

      for (const tc of testCases) {
        logs.length = 0; // reset logs per test case
        let passed = false;
        let actualOutput: unknown = undefined;
        let executionError: any = null;
        let durationMs = 0;

        try {
          (sandboxContext as any).__tc_input = JSON.parse(
            JSON.stringify(tc.input)
          );
          const execScript = new vm.Script(
            `(${functionName})(...__tc_input);`
          );
          const start = performance.now();
          actualOutput = execScript.runInContext(sandboxContext, {
            timeout: timeoutMs,
          });
          if (
            actualOutput !== null &&
            typeof actualOutput === "object" &&
            typeof (actualOutput as any).then === "function"
          ) {
            actualOutput = await actualOutput;
          }
          durationMs = performance.now() - start;
          passed = deepEqual(actualOutput, tc.expectedOutput);
        } catch (err: any) {
          executionError = err;
          if (/timed out/i.test(err?.message || "")) {
            const tleResp: RunCodeResponse = {
              action,
              verdict: "TIME_LIMIT_EXCEEDED",
              totalDurationMs: timeoutMs,
              passedTestsCount: 0,
              totalTestsCount: testCases.length,
              results: testCases.map((c) => ({
                testCaseId: c.id,
                passed: false,
                expectedOutput: c.expectedOutput,
                logs: [...logs],
                executionTimeMs: timeoutMs,
                error: {
                  message: `Time Limit Exceeded: Execution took longer than ${timeoutMs}ms`,
                },
              })),
            };
            this.emit({ type: "COMPLETED", response: tleResp });
            return tleResp;
          }
        }

        if (passed) passedCount++;

        results.push({
          testCaseId: tc.id,
          passed: !executionError && passed,
          actualOutput: executionError ? undefined : actualOutput,
          expectedOutput: tc.expectedOutput,
          logs: [...logs],
          executionTimeMs: Math.round(durationMs * 100) / 100,
          error: executionError
            ? { message: executionError.message || String(executionError) }
            : undefined,
        });
      }

      let verdict: any = "ACCEPTED";
      if (results.some((r) => r.error)) {
        verdict = "RUNTIME_ERROR";
      } else if (passedCount < testCases.length) {
        verdict = "WRONG_ANSWER";
      }

      const response: RunCodeResponse = {
        action,
        verdict,
        totalDurationMs: Math.round(performance.now() - startTime),
        results,
        passedTestsCount: passedCount,
        totalTestsCount: testCases.length,
      };

      this.emit({ type: "COMPLETED", response });
      return response;
    } catch {
      // If node:vm fails, fallback to executeUserCode
      const resp = await executeUserCode(request);
      this.emit({ type: "COMPLETED", response: resp });
      return resp;
    }
  }

  public terminate(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    if (this.worker) {
      try {
        this.worker.terminate();
      } catch {
        // ignore
      }
      this.worker = null;
    }
  }

  public dispose(): void {
    this.terminate();
    this.eventListeners = [];
  }
}
