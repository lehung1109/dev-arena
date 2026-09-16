"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Terminal,
  Clock3,
  Loader2,
  Activity,
  Code2,
  AlertOctagon,
  Sparkles,
} from "lucide-react";
import type { RunCodeResponse, TestCasePayload, BenchmarkPoint, ASTAnalysisMetrics } from "@/types/runner";
import { formatValue } from "@/lib/runner/deep-equal";
import { ComplexityCard } from "@/components/analysis/ComplexityCard";
import { AstWarningsList } from "@/components/analysis/AstWarningsList";

export interface OutputPanelProps {
  response: RunCodeResponse | null;
  isRunning: boolean;
  testCases: TestCasePayload[];
  astMetrics?: ASTAnalysisMetrics | null;
  benchmarkPoints?: BenchmarkPoint[];
  estimatedBigO?: string;
  optimalBigO?: string;
  complexityConfidence?: number;
  complexityExplanation?: string;
  isBenchmarking?: boolean;
  onRunBenchmark?: () => void;
  activeTab?: "testcase" | "result" | "analysis";
  onTabChange?: (tab: "testcase" | "result" | "analysis") => void;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  response,
  isRunning,
  testCases,
  astMetrics = null,
  benchmarkPoints = [],
  estimatedBigO,
  optimalBigO = "O(N)",
  complexityConfidence = 0.85,
  complexityExplanation,
  isBenchmarking = false,
  onRunBenchmark,
  activeTab: controlledTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<"testcase" | "result" | "analysis">("testcase");
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);

  const currentTab = controlledTab || internalTab;

  const setTab = (tab: "testcase" | "result" | "analysis") => {
    setInternalTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Automatically switch to result tab when execution completes
  useEffect(() => {
    if (response) {
      setTab("result");
    }
  }, [response]);

  const activeCase = testCases[selectedCaseIdx] || testCases[0];
  const activeResult = response?.results?.[selectedCaseIdx];

  const getVerdictBadge = () => {
    if (!response) return null;

    switch (response.verdict) {
      case "ACCEPTED":
        return (
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-base">
            <CheckCircle2 className="h-5 w-5" />
            <span>Accepted</span>
          </div>
        );
      case "WRONG_ANSWER":
        return (
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-base">
            <XCircle className="h-5 w-5" />
            <span>Wrong Answer</span>
          </div>
        );
      case "TIME_LIMIT_EXCEEDED":
        return (
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-base">
            <Clock className="h-5 w-5" />
            <span>Time Limit Exceeded (TLE)</span>
          </div>
        );
      case "RUNTIME_ERROR":
        return (
          <div className="flex items-center gap-2 text-red-400 font-semibold text-base">
            <AlertTriangle className="h-5 w-5" />
            <span>Runtime Error</span>
          </div>
        );
      case "SYNTAX_ERROR":
        return (
          <div className="flex items-center gap-2 text-red-400 font-semibold text-base">
            <AlertOctagon className="h-5 w-5" />
            <span>Syntax Error</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0c121e] border-t border-slate-800 text-sm overflow-hidden select-text">
      {/* Top Tabs Bar: Testcase | Result | Analysis */}
      <div className="flex items-center justify-between px-3 border-b border-slate-800/80 bg-[#090d16] h-10">
        <div className="flex items-center gap-1">
          {/* Testcase Tab */}
          <button
            type="button"
            onClick={() => setTab("testcase")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t border-b-2 transition-all ${
              currentTab === "testcase"
                ? "border-blue-500 text-blue-400 bg-slate-800/40"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Testcase</span>
          </button>

          {/* Result Tab */}
          <button
            type="button"
            onClick={() => setTab("result")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t border-b-2 transition-all ${
              currentTab === "result"
                ? "border-blue-500 text-blue-400 bg-slate-800/40"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Result</span>
            {response && (
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  response.verdict === "ACCEPTED" ? "bg-emerald-400" : "bg-rose-500"
                }`}
              />
            )}
          </button>

          {/* Analysis Tab */}
          <button
            type="button"
            onClick={() => setTab("analysis")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t border-b-2 transition-all ${
              currentTab === "analysis"
                ? "border-blue-500 text-blue-400 bg-slate-800/40"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-indigo-400" />
            <span>Analysis</span>
            {estimatedBigO && (
              <span className="rounded bg-indigo-500/20 text-indigo-300 px-1 text-[10px] font-mono border border-indigo-500/30">
                {estimatedBigO}
              </span>
            )}
            {astMetrics && (astMetrics.maxLoopDepth >= 2 || astMetrics.hasRecursion) && (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Right Status Summary */}
        {isRunning ? (
          <div className="flex items-center gap-1.5 text-xs text-blue-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Executing sandbox...</span>
          </div>
        ) : response ? (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 font-mono">
              Passed:{" "}
              <strong className="text-slate-200">
                {response.passedTestsCount}/{response.totalTestsCount}
              </strong>
            </span>
            <div className="flex items-center gap-1 text-slate-400 font-mono">
              <Clock3 className="h-3.5 w-3.5 text-slate-500" />
              <span>{response.totalDurationMs}ms</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
        {isRunning ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <Loader2 className="h-7 w-7 animate-spin text-blue-500 mb-2" />
            <p className="text-sm font-sans text-slate-300">
              Running code in sandboxed Web Worker...
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Safety timeout active (2000ms cutoff)
            </p>
          </div>
        ) : currentTab === "analysis" ? (
          /* Analysis Tab View */
          <div className="space-y-4 font-sans">
            <ComplexityCard
              estimatedBigO={estimatedBigO || response?.estimatedBigO}
              optimalBigO={optimalBigO}
              confidence={complexityConfidence}
              explanation={complexityExplanation}
              benchmarkPoints={benchmarkPoints.length > 0 ? benchmarkPoints : (response?.benchmarkPoints || [])}
              isLoading={isBenchmarking}
              onRunBenchmark={onRunBenchmark}
            />

            <AstWarningsList
              metrics={astMetrics || response?.astMetrics || null}
              isLoading={false}
            />
          </div>
        ) : currentTab === "testcase" ? (
          /* Testcase Tab View */
          <div className="space-y-4">
            {/* Case Selection Buttons */}
            <div className="flex items-center gap-1 pb-1 overflow-x-auto">
              {testCases.map((tc, idx) => (
                <button
                  key={tc.id || idx}
                  type="button"
                  onClick={() => setSelectedCaseIdx(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    selectedCaseIdx === idx
                      ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <span>Case {idx + 1}</span>
                </button>
              ))}
            </div>

            {activeCase && (
              <div className="space-y-3">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-sans">
                    Input:
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-slate-200 overflow-x-auto font-mono">
                    {Array.isArray(activeCase.input)
                      ? activeCase.input
                          .map((val) => formatValue(val))
                          .join(", ")
                      : formatValue(activeCase.input)}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-sans">
                    Expected Output:
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-emerald-300 overflow-x-auto font-mono">
                    {formatValue(activeCase.expectedOutput)}
                  </div>
                </div>

                {activeCase.explanation && (
                  <div className="text-xs text-slate-400 font-sans italic">
                    Note: {activeCase.explanation}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Result Tab View */
          <>
            {!response ? (
              <div className="flex flex-col items-center justify-center h-44 text-slate-500 font-sans">
                <Terminal className="h-8 w-8 mb-2 text-slate-700" />
                <p className="text-xs font-medium text-slate-400">
                  No execution results yet
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Click &quot;Run&quot; above to test your code against public test cases.
                </p>
              </div>
            ) : (
              <>
                {/* Overall Verdict Banner */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center gap-4">
                    {getVerdictBadge()}
                    {response.verdict === "ACCEPTED" && (
                      <span className="text-xs text-slate-400 font-sans">
                        All {response.totalTestsCount} test cases passed
                        successfully!
                      </span>
                    )}
                  </div>
                </div>

                {/* Case Selection Tabs for Results */}
                <div className="flex items-center gap-1 border-b border-slate-800 pb-2 overflow-x-auto">
                  {testCases.map((tc, idx) => {
                    const res = response?.results?.[idx];
                    const isSelected = selectedCaseIdx === idx;

                    return (
                      <button
                        key={tc.id || idx}
                        type="button"
                        onClick={() => setSelectedCaseIdx(idx)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                        }`}
                      >
                        {res && (
                          <span
                            className={`h-2 w-2 rounded-full ${
                              res.passed ? "bg-emerald-400" : "bg-rose-500"
                            }`}
                          />
                        )}
                        <span>Case {idx + 1}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Error Message Callout if present */}
                {activeResult?.error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-red-300 font-sans">
                    <div className="flex items-center gap-2 font-semibold text-xs text-red-400 mb-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span>
                        {response?.verdict === "TIME_LIMIT_EXCEEDED"
                          ? "Time Limit Exceeded"
                          : "Execution Error"}
                      </span>
                    </div>
                    <pre className="font-mono text-xs text-red-200 whitespace-pre-wrap break-all mt-1">
                      {activeResult.error.message}
                    </pre>
                    {activeResult.error.sanitizedStack && (
                      <pre className="font-mono text-[11px] text-red-400/80 whitespace-pre-wrap mt-2 max-h-32 overflow-y-auto">
                        {activeResult.error.sanitizedStack}
                      </pre>
                    )}
                  </div>
                )}

                {/* Case Details */}
                {activeCase && (
                  <div className="space-y-3">
                    {/* Input */}
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-sans">
                        Input:
                      </div>
                      <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-slate-200 overflow-x-auto font-mono">
                        {Array.isArray(activeCase.input)
                          ? activeCase.input
                              .map((val) => formatValue(val))
                              .join(", ")
                          : formatValue(activeCase.input)}
                      </div>
                    </div>

                    {/* Expected Output */}
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-sans">
                        Expected Output:
                      </div>
                      <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-emerald-300 overflow-x-auto font-mono">
                        {formatValue(activeCase.expectedOutput)}
                      </div>
                    </div>

                    {/* Actual Output */}
                    {activeResult && activeResult.actualOutput !== undefined && (
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-sans">
                          Actual Output:
                        </div>
                        <div
                          className={`p-2.5 rounded bg-slate-950 border overflow-x-auto font-mono ${
                            activeResult.passed
                              ? "border-emerald-500/40 text-emerald-300"
                              : "border-rose-500/40 text-rose-300"
                          }`}
                        >
                          {formatValue(activeResult.actualOutput)}
                        </div>
                      </div>
                    )}

                    {/* Console Logs */}
                    {activeResult?.logs && activeResult.logs.length > 0 && (
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-sans flex items-center gap-1.5">
                          <Terminal className="h-3 w-3 text-slate-400" />
                          <span>Console Output (stdout):</span>
                        </div>
                        <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300 space-y-1 max-h-40 overflow-y-auto font-mono">
                          {activeResult.logs.map((logLine, lIdx) => (
                            <div key={lIdx} className="text-xs text-slate-300">
                              {logLine}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
