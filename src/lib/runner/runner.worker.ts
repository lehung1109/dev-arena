/// <reference lib="webworker" />
import { executeUserCode } from "./execute";
import type { RunCodeRequest } from "@/types/runner";

/**
 * Sandboxed Web Worker execution entry point
 * Listens for RunCodeRequest, executes code within try/catch boundary,
 * and posts back typed RunCodeResponse.
 */
addEventListener("message", async (event: MessageEvent<RunCodeRequest>) => {
  try {
    const response = await executeUserCode(event.data);
    postMessage(response);
  } catch (err: any) {
    postMessage({
      action: event.data?.action || "RUN",
      verdict: "RUNTIME_ERROR",
      totalDurationMs: 0,
      results: [],
      passedTestsCount: 0,
      totalTestsCount: event.data?.testCases?.length || 0,
      error: err?.message || String(err),
    });
  }
});
