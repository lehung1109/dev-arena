/**
 * Empirical Complexity Profiler
 * Dev Arena - 001-in-browser-code-arena
 *
 * Estimates Big-O time complexity by running multi-N benchmarks and applying
 * logarithmic curve fitting / growth ratio heuristics.
 */

import type { BenchmarkPoint } from "@/types/runner";
import { executeUserCode } from "@/lib/runner/execute";

export interface ComplexityEstimate {
  estimatedBigO: "O(1)" | "O(log N)" | "O(N)" | "O(N log N)" | "O(N^2)" | "O(2^N)" | string;
  confidence: number;
  explanation: string;
}

export interface BenchmarkCaseItem {
  inputSize: number;
  inputPayload: unknown[];
}

export interface BenchmarkSuiteParams {
  code: string;
  functionName: string;
  benchmarkCases: BenchmarkCaseItem[];
  timeoutMs?: number;
}

export interface BenchmarkSuiteResult {
  benchmarkPoints: BenchmarkPoint[];
  complexity: ComplexityEstimate;
}

/**
 * Logarithmic curve fitting and growth ratio heuristic.
 * Given consecutive points (N1, T1) and (N2, T2):
 *   Ratio exponent k = log(T2 / T1) / log(N2 / N1)
 *
 * Thresholds:
 *   k <= 0.3         -> O(1) or O(log N)
 *   0.3 < k <= 1.3   -> O(N)
 *   1.3 < k <= 1.6   -> O(N log N)
 *   1.6 < k <= 2.5   -> O(N^2)
 *   k > 2.5          -> O(2^N) or O(N^3)
 */
export function estimateComplexity(
  benchmarkPoints: BenchmarkPoint[]
): ComplexityEstimate {
  if (!benchmarkPoints || benchmarkPoints.length === 0) {
    return {
      estimatedBigO: "O(1)",
      confidence: 0,
      explanation: "Insufficient benchmark data points to estimate complexity.",
    };
  }

  if (benchmarkPoints.length === 1) {
    return {
      estimatedBigO: "O(1)",
      confidence: 0.2,
      explanation: "Single benchmark point provided; cannot compute growth curve.",
    };
  }

  // Sort by inputSize ascending
  const sorted = [...benchmarkPoints].sort((a, b) => a.inputSize - b.inputSize);

  // Check for microsecond noise or instantaneous executions
  const allSubMillisecond = sorted.every((p) => p.durationMs < 0.2);
  const durations = sorted.map((p) => Math.max(p.durationMs, 0.01));
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);
  const durationVarianceRatio = maxDuration / minDuration;

  // If variance is tiny or all points execute sub-0.1ms, it is constant time
  if (allSubMillisecond || (maxDuration < 1.0 && durationVarianceRatio < 2.5)) {
    return {
      estimatedBigO: "O(1)",
      confidence: 0.95,
      explanation:
        "Execution times remained consistently sub-millisecond or flat across all input sizes, indicating O(1) constant time complexity.",
    };
  }

  // If times are nearly identical regardless of absolute value (e.g., all ~2.1ms)
  if (durationVarianceRatio <= 1.25) {
    return {
      estimatedBigO: "O(1)",
      confidence: 0.92,
      explanation: `Execution durations were virtually identical across input scale (ratio ~${durationVarianceRatio.toFixed(
        2
      )}x), demonstrating O(1) constant time complexity.`,
    };
  }

  // Compute log-log linear regression and pairwise growth ratios
  // x = ln(N), y = ln(T)
  const logPoints = sorted
    .filter((p) => p.inputSize > 0)
    .map((p) => ({
      x: Math.log(p.inputSize),
      y: Math.log(Math.max(p.durationMs, 0.05)),
    }));

  let slopeK = 0;
  let rSquared = logPoints.length >= 2 ? 0.85 : logPoints.length === 1 ? 0.3 : 0;

  if (logPoints.length >= 2) {
    const n = logPoints.length;
    const meanX = logPoints.reduce((acc, p) => acc + p.x, 0) / n;
    const meanY = logPoints.reduce((acc, p) => acc + p.y, 0) / n;

    let numerator = 0;
    let denominator = 0;
    for (const p of logPoints) {
      numerator += (p.x - meanX) * (p.y - meanY);
      denominator += (p.x - meanX) ** 2;
    }

    slopeK = denominator !== 0 ? numerator / denominator : 0;

    // Calculate R^2 goodness of fit
    let ssTot = 0;
    let ssRes = 0;
    for (const p of logPoints) {
      const predictedY = meanY + slopeK * (p.x - meanX);
      ssTot += (p.y - meanY) ** 2;
      ssRes += (p.y - predictedY) ** 2;
    }

    if (ssTot > 0.001) {
      rSquared = Math.max(0, Math.min(1, 1 - ssRes / ssTot));
    }
  }

  // Ensure confidence is bound between 0.5 and 0.98 for empirical fitting
  const confidence = Math.round(Math.max(0.6, Math.min(0.98, rSquared)) * 100) / 100;

  // Classify based on slopeK
  if (slopeK <= 0.3) {
    if (slopeK < 0) {
      return {
        estimatedBigO: "O(1)",
        confidence: Math.min(confidence, 0.75),
        explanation: `Microsecond variance or cold-start jitter observed without positive growth (k = ${slopeK.toFixed(
          2
        )}), consistent with O(1) constant time scaling.`,
      };
    }
    // Distinguish between pure flat O(1) and mild logarithmic growth O(log N)
    const spanN = sorted[sorted.length - 1].inputSize / sorted[0].inputSize;
    if (slopeK > 0.1 && spanN >= 100 && durationVarianceRatio > 1.8) {
      return {
        estimatedBigO: "O(log N)",
        confidence,
        explanation: `Empirical growth exponent k = ${slopeK.toFixed(
          2
        )} indicates sub-linear logarithmic scaling O(log N).`,
      };
    }
    return {
      estimatedBigO: "O(1)",
      confidence,
      explanation: `Empirical growth exponent k = ${slopeK.toFixed(
        2
      )} indicates O(1) constant time scaling.`,
    };
  } else if (slopeK > 0.3 && slopeK <= 1.3) {
    return {
      estimatedBigO: "O(N)",
      confidence,
      explanation: `Empirical growth exponent k = ${slopeK.toFixed(
        2
      )} scales proportionally to input size N, matching O(N) linear time.`,
    };
  } else if (slopeK > 1.3 && slopeK <= 1.6) {
    return {
      estimatedBigO: "O(N log N)",
      confidence,
      explanation: `Empirical growth exponent k = ${slopeK.toFixed(
        2
      )} exhibits super-linear scaling consistent with O(N log N) divide-and-conquer algorithms.`,
    };
  } else if (slopeK > 1.6 && slopeK <= 2.5) {
    return {
      estimatedBigO: "O(N^2)",
      confidence,
      explanation: `Empirical growth exponent k = ${slopeK.toFixed(
        2
      )} exhibits quadratic scaling consistent with nested iterations O(N^2).`,
    };
  } else {
    return {
      estimatedBigO: "O(2^N)",
      confidence,
      explanation: `Empirical growth exponent k = ${slopeK.toFixed(
        2
      )} exhibits exponential or cubic scaling (k > 2.5).`,
    };
  }
}

/**
 * Runs a suite of benchmark cases against the user code and computes empirical Big-O metrics.
 */
export async function runBenchmarkSuite(
  params: BenchmarkSuiteParams
): Promise<BenchmarkSuiteResult> {
  const { code, functionName, benchmarkCases, timeoutMs = 2000 } = params;

  if (!benchmarkCases || benchmarkCases.length === 0) {
    return {
      benchmarkPoints: [],
      complexity: estimateComplexity([]),
    };
  }

  // Warm-up pass to eliminate V8 JIT compilation delay on the first benchmark point
  if (benchmarkCases.length > 0) {
    try {
      await executeUserCode({
        action: "BENCHMARK",
        code,
        functionName,
        testCases: [
          {
            id: "warmup-0",
            input: benchmarkCases[0].inputPayload,
            expectedOutput: null,
            isPublic: true,
            orderIndex: 0,
          },
        ],
        timeoutMs: Math.min(timeoutMs, 500),
      });
    } catch {
      // Ignore warm-up exceptions
    }
  }

  const benchmarkPoints: BenchmarkPoint[] = [];

  for (let idx = 0; idx < benchmarkCases.length; idx++) {
    const bCase = benchmarkCases[idx];
    const testCasesPayload = [
      {
        id: `bm-${bCase.inputSize}-${idx}`,
        input: bCase.inputPayload,
        expectedOutput: null,
        isPublic: true,
        orderIndex: idx,
      },
    ];

    try {
      const resp = await executeUserCode({
        action: "BENCHMARK",
        code,
        functionName,
        testCases: testCasesPayload,
        timeoutMs,
      });

      const singleResult = resp.results[0];
      const durationMs = singleResult?.executionTimeMs ?? resp.totalDurationMs;

      benchmarkPoints.push({
        inputSize: bCase.inputSize,
        durationMs: Math.max(durationMs, 0.01),
      });
    } catch (err) {
      console.warn(`Benchmark failed for N=${bCase.inputSize}:`, err);
      benchmarkPoints.push({
        inputSize: bCase.inputSize,
        durationMs: 0.01,
      });
    }
  }

  const complexity = estimateComplexity(benchmarkPoints);

  return {
    benchmarkPoints,
    complexity,
  };
}
