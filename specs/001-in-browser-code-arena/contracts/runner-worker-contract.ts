/**
 * In-Browser Code Runner & Worker Protocol Contract
 * Defines typed communication between the main UI thread and the execution Web Worker.
 */

export type ExecutionVerdict = 
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'RUNTIME_ERROR'
  | 'SYNTAX_ERROR';

export interface TestCasePayload {
  id: string;
  input: unknown[];
  expectedOutput: unknown;
  isPublic: boolean;
  orderIndex: number;
}

export interface RunCodeRequest {
  action: 'RUN' | 'SUBMIT' | 'BENCHMARK';
  code: string;
  functionName: string;
  testCases: TestCasePayload[];
  timeoutMs?: number; // default: 2000
}

export interface SingleTestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput?: unknown;
  expectedOutput?: unknown;
  logs: string[];
  executionTimeMs: number;
  error?: {
    message: string;
    line?: number;
    column?: number;
    sanitizedStack?: string;
  };
}

export interface ASTAnalysisMetrics {
  maxLoopDepth: number;
  hasRecursion: boolean;
  syntaxValid: boolean;
  syntaxErrors: Array<{
    message: string;
    line: number;
    column: number;
  }>;
  structuralWarnings: string[];
}

export interface BenchmarkPoint {
  inputSize: number;
  durationMs: number;
}

export interface RunCodeResponse {
  action: 'RUN' | 'SUBMIT' | 'BENCHMARK';
  verdict: ExecutionVerdict;
  totalDurationMs: number;
  results: SingleTestResult[];
  passedTestsCount: number;
  totalTestsCount: number;
  astMetrics?: ASTAnalysisMetrics;
  benchmarkPoints?: BenchmarkPoint[];
  estimatedBigO?: 'O(1)' | 'O(log N)' | 'O(N)' | 'O(N log N)' | 'O(N^2)' | 'O(2^N)';
}

export interface WorkerRunnerEvent {
  type: 'STARTED' | 'PROGRESS' | 'COMPLETED' | 'ERROR';
  completedTests?: number;
  totalTests?: number;
  response?: RunCodeResponse;
  error?: string;
}
