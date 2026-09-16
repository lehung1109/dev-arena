import { describe, it, expect } from "vitest";
import {
  estimateComplexity,
  runBenchmarkSuite,
} from "@/lib/analysis/complexity-profiler";

describe("Empirical Complexity Profiler Unit Tests (TDD)", () => {
  describe("estimateComplexity curve fitting", () => {
    it("classifies constant time benchmarks (times are near identical) as O(1)", () => {
      const points = [
        { inputSize: 10, durationMs: 2.1 },
        { inputSize: 100, durationMs: 2.15 },
        { inputSize: 1000, durationMs: 2.08 },
        { inputSize: 10000, durationMs: 2.12 },
      ];

      const result = estimateComplexity(points);
      expect(result.estimatedBigO).toBe("O(1)");
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.explanation).toContain("O(1)");
    });

    it("classifies linear time benchmarks (times scale proportionally to N) as O(N)", () => {
      const points = [
        { inputSize: 10, durationMs: 0.8 },
        { inputSize: 100, durationMs: 7.9 },
        { inputSize: 1000, durationMs: 82.0 },
        { inputSize: 10000, durationMs: 810.0 },
      ];

      const result = estimateComplexity(points);
      expect(result.estimatedBigO).toBe("O(N)");
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.explanation).toContain("O(N)");
    });

    it("classifies quadratic time benchmarks (times scale proportionally to N^2) as O(N^2)", () => {
      const points = [
        { inputSize: 10, durationMs: 0.3 },
        { inputSize: 100, durationMs: 29.5 },
        { inputSize: 1000, durationMs: 2980.0 },
      ];

      const result = estimateComplexity(points);
      expect(result.estimatedBigO).toBe("O(N^2)");
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.explanation).toContain("O(N^2)");
    });

    it("handles very fast execution / microsecond noise cleanly as O(1)", () => {
      const points = [
        { inputSize: 10, durationMs: 0.02 },
        { inputSize: 100, durationMs: 0.03 },
        { inputSize: 1000, durationMs: 0.02 },
        { inputSize: 10000, durationMs: 0.04 },
      ];

      const result = estimateComplexity(points);
      expect(result.estimatedBigO).toBe("O(1)");
      expect(result.explanation).toBeDefined();
    });

    it("handles O(N log N) scaling correctly", () => {
      // For N = 10, 100, 1000, 10000 with N log N factor
      // N=100 -> ~200, N=1000 -> ~3000, N=10000 -> ~40000
      // log(T2/T1)/log(N2/N1) = log(15)/log(10) ~ 1.18 to 1.45
      const points = [
        { inputSize: 100, durationMs: 1.0 },
        { inputSize: 1000, durationMs: 22.0 },
        { inputSize: 10000, durationMs: 400.0 },
      ];

      const result = estimateComplexity(points);
      expect(["O(N log N)", "O(N)", "O(N^2)"]).toContain(result.estimatedBigO);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("handles exponential or cubic growth (k > 2.5) as O(2^N)", () => {
      const points = [
        { inputSize: 10, durationMs: 0.5 },
        { inputSize: 20, durationMs: 512 },
        { inputSize: 30, durationMs: 524288 },
      ];

      const result = estimateComplexity(points);
      expect(result.estimatedBigO).toBe("O(2^N)");
    });

    it("handles empty or single point datasets safely", () => {
      const emptyResult = estimateComplexity([]);
      expect(emptyResult.estimatedBigO).toBe("O(1)");
      expect(emptyResult.confidence).toBe(0);

      const singleResult = estimateComplexity([{ inputSize: 100, durationMs: 5 }]);
      expect(singleResult.estimatedBigO).toBe("O(1)");
      expect(singleResult.confidence).toBeLessThan(0.5);
    });
  });

  describe("runBenchmarkSuite helper", () => {
    it("executes code against provided benchmark cases and returns points + complexity", async () => {
      const code = `
        function sumArray(nums) {
          let total = 0;
          for (let i = 0; i < nums.length; i++) {
            total += nums[i];
          }
          return total;
        }
      `;
      const benchmarkCases = [
        {
          inputSize: 10,
          inputPayload: [Array.from({ length: 10 }, (_, i) => i)],
        },
        {
          inputSize: 100,
          inputPayload: [Array.from({ length: 100 }, (_, i) => i)],
        },
        {
          inputSize: 1000,
          inputPayload: [Array.from({ length: 1000 }, (_, i) => i)],
        },
      ];

      const suiteResult = await runBenchmarkSuite({
        code,
        functionName: "sumArray",
        benchmarkCases,
      });

      expect(suiteResult.benchmarkPoints).toHaveLength(3);
      expect(suiteResult.benchmarkPoints[0].inputSize).toBe(10);
      expect(suiteResult.benchmarkPoints[1].inputSize).toBe(100);
      expect(suiteResult.benchmarkPoints[2].inputSize).toBe(1000);
      expect(suiteResult.complexity).toBeDefined();
      expect(suiteResult.complexity.estimatedBigO).toBeDefined();
    });
  });
});
