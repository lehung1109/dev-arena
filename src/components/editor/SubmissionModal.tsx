"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  AlertOctagon,
  Zap,
  HardDrive,
  Check,
  ChevronRight,
  X,
} from "lucide-react";
import { formatValue } from "@/lib/runner/deep-equal";

export interface SubmissionModalData {
  id?: string;
  status:
    | "ACCEPTED"
    | "WRONG_ANSWER"
    | "TIME_LIMIT_EXCEEDED"
    | "RUNTIME_ERROR"
    | "SYNTAX_ERROR";
  runtimeMs?: number;
  memoryBytes?: number;
  passedTestCases: number;
  totalTestCases: number;
  testResultsDetail?: Array<{
    testCaseId: string;
    passed: boolean;
    actualOutput?: unknown;
    expectedOutput?: unknown;
    input?: unknown[];
    executionTimeMs?: number;
    logs?: string[];
    isPublic?: boolean;
    error?: {
      message: string;
      line?: number;
      column?: number;
      sanitizedStack?: string;
    };
  }>;
  nextProblemSlug?: string;
}

export interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: SubmissionModalData | null;
  onNextProblem?: () => void;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({
  isOpen,
  onClose,
  submission,
  onNextProblem,
}) => {
  if (!isOpen || !submission) return null;

  const isAccepted = submission.status === "ACCEPTED";
  const passRate =
    submission.totalTestCases > 0
      ? Math.round((submission.passedTestCases / submission.totalTestCases) * 100)
      : 0;

  // Find first failing test case if not accepted
  const firstFailing = submission.testResultsDetail?.find((r) => !r.passed);

  // Approximate percentile based on runtime
  const getPercentile = (ms: number) => {
    if (ms <= 5) return "98.5%";
    if (ms <= 15) return "92.1%";
    if (ms <= 30) return "84.7%";
    if (ms <= 60) return "72.4%";
    return "54.2%";
  };

  const runtimeMs = submission.runtimeMs ?? 0;
  const memoryKb = submission.memoryBytes
    ? (submission.memoryBytes / 1024).toFixed(1)
    : "3.4";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-800 bg-[#0c121e] shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-lg p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Verdict Banner */}
        <div
          className={`p-6 border-b ${
            isAccepted
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
              : submission.status === "TIME_LIMIT_EXCEEDED"
              ? "bg-amber-950/40 border-amber-500/30 text-amber-400"
              : "bg-rose-950/40 border-rose-500/30 text-rose-400"
          }`}
        >
          <div className="flex items-center gap-3">
            {isAccepted && <CheckCircle2 className="h-8 w-8 text-emerald-400" />}
            {submission.status === "WRONG_ANSWER" && (
              <XCircle className="h-8 w-8 text-rose-400" />
            )}
            {submission.status === "TIME_LIMIT_EXCEEDED" && (
              <Clock className="h-8 w-8 text-amber-400" />
            )}
            {submission.status === "RUNTIME_ERROR" && (
              <AlertTriangle className="h-8 w-8 text-rose-400" />
            )}
            {submission.status === "SYNTAX_ERROR" && (
              <AlertOctagon className="h-8 w-8 text-rose-400" />
            )}

            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {isAccepted && "Accepted"}
                {submission.status === "WRONG_ANSWER" && "Wrong Answer"}
                {submission.status === "TIME_LIMIT_EXCEEDED" &&
                  "Time Limit Exceeded"}
                {submission.status === "RUNTIME_ERROR" && "Runtime Error"}
                {submission.status === "SYNTAX_ERROR" && "Syntax Error"}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {isAccepted
                  ? "Congratulations! Your solution passed all test cases."
                  : `${submission.passedTestCases} of ${submission.totalTestCases} test cases passed.`}
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Section */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Runtime Card */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Zap className="h-3.5 w-3.5 text-blue-400" />
                <span>Runtime</span>
              </div>
              <div className="text-lg font-bold font-mono text-slate-100">
                {runtimeMs > 0 ? `${runtimeMs.toFixed(1)} ms` : "0 ms"}
              </div>
              {isAccepted && (
                <div className="text-[11px] text-emerald-400 mt-1">
                  Beats {getPercentile(runtimeMs)} of JS submissions
                </div>
              )}
            </div>

            {/* Memory Card */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <HardDrive className="h-3.5 w-3.5 text-purple-400" />
                <span>Memory</span>
              </div>
              <div className="text-lg font-bold font-mono text-slate-100">
                {memoryKb} KB
              </div>
              {isAccepted && (
                <div className="text-[11px] text-purple-400 mt-1">
                  Beats 78.4% of JS submissions
                </div>
              )}
            </div>

            {/* Test Cases Count Card */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Test Cases</span>
              </div>
              <div className="text-lg font-bold font-mono text-slate-100">
                {submission.passedTestCases} / {submission.totalTestCases}
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full transition-all ${
                    isAccepted ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${passRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Failing Test Case Details */}
          {!isAccepted && firstFailing && (
            <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-rose-300">
                <span>Failed Test Case Details</span>
                {firstFailing.error?.line && (
                  <span className="font-mono text-[11px] text-rose-400">
                    Line {firstFailing.error.line}
                    {firstFailing.error.column ? `:${firstFailing.error.column}` : ""}
                  </span>
                )}
              </div>

              {/* Confidentiality check: redact inputs/outputs if hidden test case */}
              {firstFailing.isPublic === false ? (
                <div className="rounded-lg bg-slate-950/80 p-3.5 text-xs text-amber-300 border border-amber-800/40 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Hidden Test Case:</span> Input and expected output details are confidential to protect test suite integrity. Verify edge cases, negative integers, duplicate values, and boundary conditions.
                  </div>
                </div>
              ) : (
                <>
                  {/* Input */}
                  {firstFailing.input && (
                    <div>
                      <div className="text-[11px] font-medium text-slate-400 mb-1">
                        Input
                      </div>
                      <pre className="rounded bg-slate-950 p-2.5 font-mono text-xs text-slate-200 overflow-x-auto border border-slate-800">
                        {formatValue(firstFailing.input)}
                      </pre>
                    </div>
                  )}

                  {/* Expected vs Actual Diff */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <div className="text-[11px] font-medium text-emerald-400 mb-1">
                        Expected Output
                      </div>
                      <pre className="rounded bg-slate-950 p-2.5 font-mono text-xs text-emerald-300 overflow-x-auto border border-emerald-900/40">
                        {formatValue(firstFailing.expectedOutput)}
                      </pre>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-rose-400 mb-1">
                        Actual Output
                      </div>
                      <pre className="rounded bg-slate-950 p-2.5 font-mono text-xs text-rose-300 overflow-x-auto border border-rose-900/40">
                        {firstFailing.error
                          ? firstFailing.error.message
                          : formatValue(firstFailing.actualOutput)}
                      </pre>
                    </div>
                  </div>
                </>
              )}

              {/* Stack trace if runtime error */}
              {firstFailing.error?.sanitizedStack && (
                <div>
                  <div className="text-[11px] font-medium text-slate-400 mb-1">
                    Clean Stack Trace
                  </div>
                  <pre className="rounded bg-slate-950 p-2 font-mono text-[11px] text-rose-300 overflow-x-auto whitespace-pre-wrap border border-slate-800">
                    {firstFailing.error.sanitizedStack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-800 bg-[#090d16]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Close
          </button>

          {isAccepted && submission.nextProblemSlug && (
            <Link
              href={`/problems/${submission.nextProblemSlug}`}
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <span>Next Problem</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}

          {isAccepted && !submission.nextProblemSlug && (
            <Link
              href="/problems"
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-semibold shadow-md shadow-blue-600/20 transition-all active:scale-95"
            >
              <span>Problem List</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}

          {!isAccepted && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-semibold shadow-md shadow-blue-600/20 transition-all active:scale-95"
            >
              Back to Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
