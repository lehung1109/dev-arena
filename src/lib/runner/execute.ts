/**
 * Core Code Execution Sandbox Engine
 * Dev Arena - 001-in-browser-code-arena
 */

import { deepEqual, formatValue } from "./deep-equal";
import type {
  ExecutionVerdict,
  RunCodeRequest,
  RunCodeResponse,
  SingleTestResult,
} from "@/types/runner";

/**
 * Executes user-provided JavaScript code against test cases in an isolated try/catch boundary
 * with hijacked console logging and high-resolution execution duration tracking.
 */
export async function executeUserCode(
  request: RunCodeRequest
): Promise<RunCodeResponse> {
  const { action, code, functionName, testCases = [] } = request;
  const startTime = performance.now();

  let targetFn: (...args: unknown[]) => unknown;

  // 1. Compile and extract target function
  try {
    const wrappedCode = `"use strict";\n${code}\n;if (typeof ${functionName} !== "function") { throw new TypeError("${functionName} is not defined or is not a function"); }\nreturn ${functionName};`;
    const compile = new Function(wrappedCode);
    targetFn = compile();
  } catch (err: any) {
    const isSyntax =
      err instanceof SyntaxError ||
      err?.name === "SyntaxError" ||
      /syntax|unexpected token/i.test(err?.message || "");

    const errorResult = {
      message: err?.message || String(err),
      sanitizedStack: err?.stack,
    };

    return {
      action,
      verdict: isSyntax ? "SYNTAX_ERROR" : "RUNTIME_ERROR",
      totalDurationMs: Math.round(performance.now() - startTime),
      results: testCases.map((tc) => ({
        testCaseId: tc.id,
        passed: false,
        expectedOutput: tc.expectedOutput,
        logs: [],
        executionTimeMs: 0,
        error: errorResult,
      })),
      passedTestsCount: 0,
      totalTestsCount: testCases.length,
    };
  }

  // 2. Execute test cases sequentially with console interception
  const results: SingleTestResult[] = [];
  let passedCount = 0;

  for (const tc of testCases) {
    const logs: string[] = [];
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
    };

    const capture = (...args: unknown[]) => {
      try {
        const formatted = args
          .map((a) => (typeof a === "string" ? a : formatValue(a)))
          .join(" ");
        logs.push(formatted);
      } catch {
        logs.push(args.map((a) => String(a)).join(" "));
      }
    };

    console.log = capture;
    console.info = capture;
    console.warn = capture;
    console.error = capture;

    let passed = false;
    let actualOutput: unknown = undefined;
    let executionError: any = null;
    let durationMs = 0;

    try {
      // Clone input so in-place mutations don't alter test integrity
      const clonedInput = JSON.parse(JSON.stringify(tc.input));
      const caseStart = performance.now();
      actualOutput = targetFn(...clonedInput);
      if (
        actualOutput !== null &&
        typeof actualOutput === "object" &&
        typeof (actualOutput as any).then === "function"
      ) {
        actualOutput = await actualOutput;
      }
      durationMs = performance.now() - caseStart;
      passed = deepEqual(actualOutput, tc.expectedOutput);
    } catch (err: any) {
      executionError = err;
    } finally {
      // Restore console immediately
      console.log = originalConsole.log;
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
    }

    if (passed) {
      passedCount++;
    }

    results.push({
      testCaseId: tc.id,
      passed: !executionError && passed,
      actualOutput: executionError ? undefined : actualOutput,
      expectedOutput: tc.expectedOutput,
      logs,
      executionTimeMs: Math.round(durationMs * 100) / 100,
      error: executionError
        ? {
            message: executionError.message || String(executionError),
            sanitizedStack: executionError.stack,
          }
        : undefined,
    });
  }

  // 3. Determine overall verdict
  let verdict: ExecutionVerdict = "ACCEPTED";
  if (results.some((r) => r.error)) {
    verdict = "RUNTIME_ERROR";
  } else if (passedCount < testCases.length) {
    verdict = "WRONG_ANSWER";
  }

  return {
    action,
    verdict,
    totalDurationMs: Math.round(performance.now() - startTime),
    results,
    passedTestsCount: passedCount,
    totalTestsCount: testCases.length,
  };
}
