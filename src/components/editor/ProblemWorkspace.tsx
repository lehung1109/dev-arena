"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  BookOpen,
  HelpCircle,
  History,
  Tag,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  AlertOctagon,
  Loader2,
  Code2,
  Sparkles,
} from "lucide-react";
import { MonacoCodeEditor } from "@/components/editor/MonacoCodeEditor";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { OutputPanel } from "@/components/editor/OutputPanel";
import {
  SubmissionModal,
  type SubmissionModalData,
} from "@/components/editor/SubmissionModal";
import { AITutorPanel } from "@/components/ai/AITutorPanel";
import { WorkerRunnerManager } from "@/lib/runner/WorkerRunnerManager";
import { sanitizeStackTrace } from "@/lib/runner/error-sanitizer";
import { analyzeAST, type ExtendedASTAnalysisMetrics } from "@/lib/analysis/ast-analyzer";
import {
  runBenchmarkSuite,
  estimateComplexity,
} from "@/lib/analysis/complexity-profiler";
import type {
  RunCodeResponse,
  TestCasePayload,
  BenchmarkPoint,
  ASTAnalysisMetrics,
} from "@/types/runner";

export interface ProblemData {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topicTags: string[];
  starterCode: string;
  functionName: string;
  hints: string[];
  publicTestCases: TestCasePayload[];
  benchmarkCases?: Array<{ inputSize: number; inputPayload: unknown[] }>;
  optimalBigO?: string;
}

interface ProblemWorkspaceProps {
  problem: ProblemData;
}

export const ProblemWorkspace: React.FC<ProblemWorkspaceProps> = ({
  problem,
}) => {
  const [code, setCode] = useState(problem.starterCode);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResponse, setRunResponse] = useState<RunCodeResponse | null>(null);
  const [activeTab, setActiveTab] = useState<
    "description" | "hints" | "submissions"
  >("description");
  const [openHints, setOpenHints] = useState<Record<number, boolean>>({});

  // AST Analysis & Complexity Profiling State
  const [astMetrics, setAstMetrics] = useState<ExtendedASTAnalysisMetrics | null>(null);
  const [benchmarkPoints, setBenchmarkPoints] = useState<BenchmarkPoint[]>([]);
  const [estimatedBigO, setEstimatedBigO] = useState<string | undefined>(undefined);
  const [complexityConfidence, setComplexityConfidence] = useState<number>(0.85);
  const [complexityExplanation, setComplexityExplanation] = useState<string | undefined>(undefined);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [bottomTab, setBottomTab] = useState<"testcase" | "result" | "analysis">("testcase");

  // Submissions state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<SubmissionModalData | null>(null);
  const [submissionsHistory, setSubmissionsHistory] = useState<any[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(
    null
  );

  // Socratic AI Tutor drawer state
  const [isAITutorOpen, setIsAITutorOpen] = useState(false);

  const runnerRef = useRef<WorkerRunnerManager | null>(null);

  // Initialize WorkerRunnerManager
  useEffect(() => {
    runnerRef.current = new WorkerRunnerManager();
    return () => {
      runnerRef.current?.dispose();
    };
  }, []);

  // Perform continuous static AST inspection with 200ms debounce as user edits code
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const metrics = analyzeAST(code);
        setAstMetrics(metrics);
      } catch (err) {
        console.warn("AST static analysis error:", err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [code]);

  const fetchSubmissions = async () => {
    setIsLoadingSubmissions(true);
    try {
      const res = await fetch(`/api/submissions?problemId=${problem.slug}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissionsHistory(data.items || []);
      }
    } catch (err) {
      console.error("Failed to load submissions history:", err);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const runBenchmarks = async () => {
    if (!problem.benchmarkCases || problem.benchmarkCases.length === 0) return;
    setIsBenchmarking(true);
    try {
      const suite = await runBenchmarkSuite({
        code,
        functionName: problem.functionName,
        benchmarkCases: problem.benchmarkCases,
        timeoutMs: 2000,
      });
      setBenchmarkPoints(suite.benchmarkPoints);
      setEstimatedBigO(suite.complexity.estimatedBigO);
      setComplexityConfidence(suite.complexity.confidence);
      setComplexityExplanation(suite.complexity.explanation);
    } catch (err) {
      console.warn("Benchmarking error:", err);
    } finally {
      setIsBenchmarking(false);
    }
  };

  const handleRun = async () => {
    if (isRunning || isSubmitting || !runnerRef.current) return;

    setIsRunning(true);
    setBottomTab("result");

    // 1. Static AST analysis
    const currentAst = analyzeAST(code);
    setAstMetrics(currentAst);

    try {
      // 2. Execute public test cases
      const response = await runnerRef.current.runCode({
        action: "RUN",
        code,
        functionName: problem.functionName,
        testCases: problem.publicTestCases,
        timeoutMs: 2000,
      });

      // 3. Run empirical multi-N benchmarks if available
      if (problem.benchmarkCases && problem.benchmarkCases.length > 0) {
        setIsBenchmarking(true);
        try {
          const suite = await runBenchmarkSuite({
            code,
            functionName: problem.functionName,
            benchmarkCases: problem.benchmarkCases,
            timeoutMs: 2000,
          });
          setBenchmarkPoints(suite.benchmarkPoints);
          setEstimatedBigO(suite.complexity.estimatedBigO);
          setComplexityConfidence(suite.complexity.confidence);
          setComplexityExplanation(suite.complexity.explanation);

          response.benchmarkPoints = suite.benchmarkPoints;
          response.estimatedBigO = suite.complexity.estimatedBigO as any;
        } finally {
          setIsBenchmarking(false);
        }
      }

      response.astMetrics = currentAst;
      setRunResponse(response);
    } catch (err: any) {
      const sanitized = sanitizeStackTrace(err?.message || String(err), 1);
      setRunResponse({
        action: "RUN",
        verdict: "RUNTIME_ERROR",
        totalDurationMs: 0,
        passedTestsCount: 0,
        totalTestsCount: problem.publicTestCases.length,
        astMetrics: currentAst,
        results: problem.publicTestCases.map((tc) => ({
          testCaseId: tc.id,
          passed: false,
          logs: [],
          executionTimeMs: 0,
          error: {
            message: sanitized.message,
            line: sanitized.line,
            column: sanitized.column,
            sanitizedStack: sanitized.cleanStack,
          },
        })),
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (isRunning || isSubmitting || !runnerRef.current) return;

    setIsSubmitting(true);

    // 1. Static AST analysis
    const currentAst = analyzeAST(code);
    setAstMetrics(currentAst);

    try {
      // 2. Fetch all test cases (public + hidden)
      const tcRes = await fetch(
        `/api/problems/${problem.slug}/test-cases?scope=all`
      );
      if (!tcRes.ok) {
        throw new Error("Failed to fetch evaluation test cases");
      }
      const tcData = await tcRes.json();
      const allTestCases: TestCasePayload[] = tcData.testCases || [];

      // 3. Run full test suite in WorkerRunnerManager
      const evalResponse = await runnerRef.current.runCode({
        action: "SUBMIT",
        code,
        functionName: problem.functionName,
        testCases: allTestCases,
        timeoutMs: 2000,
      });

      // 4. Run benchmarks for Big-O estimation
      let currentBigO = estimatedBigO;
      let currentPoints = benchmarkPoints;
      const bCases = problem.benchmarkCases || tcData.benchmarkCases || [];
      if (bCases.length > 0) {
        try {
          const suite = await runBenchmarkSuite({
            code,
            functionName: problem.functionName,
            benchmarkCases: bCases,
            timeoutMs: 2000,
          });
          currentPoints = suite.benchmarkPoints;
          currentBigO = suite.complexity.estimatedBigO;
          setBenchmarkPoints(currentPoints);
          setEstimatedBigO(currentBigO);
          setComplexityConfidence(suite.complexity.confidence);
          setComplexityExplanation(suite.complexity.explanation);
        } catch (bErr) {
          console.warn("Benchmark profiling during submit:", bErr);
        }
      }

      // 5. Attach input payloads and sanitize errors for test results detail
      const detailedResults = evalResponse.results.map((r) => {
        const matchingTestCase = allTestCases.find((tc) => tc.id === r.testCaseId);
        const isPublic = matchingTestCase ? matchingTestCase.isPublic : true;
        let error = r.error;
        if (error) {
          const sanitized = sanitizeStackTrace(error.message || "", 1);
          error = {
            message: sanitized.message,
            line: sanitized.line,
            column: sanitized.column,
            sanitizedStack: sanitized.cleanStack,
          };
        }
        return {
          ...r,
          isPublic,
          input: isPublic ? matchingTestCase?.input : undefined,
          expectedOutput: isPublic ? r.expectedOutput : undefined,
          error,
        };
      });

      // 6. Post submission record to /api/submissions
      const submissionPayload = {
        problemId: problem.slug,
        code,
        status: evalResponse.verdict,
        runtimeMs: evalResponse.totalDurationMs,
        memoryBytes: 2048,
        passedTestCases: evalResponse.passedTestsCount,
        totalTestCases: evalResponse.totalTestsCount,
        testResultsDetail: detailedResults,
        astMetrics: currentAst,
      };

      const subRes = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionPayload),
      });

      const savedSub = subRes.ok ? await subRes.json() : null;

      // 7. Open SubmissionModal with full results
      const nextProblemMap: Record<string, string> = {
        "two-sum": "valid-parentheses",
      };
      const nextSlug = nextProblemMap[problem.slug] || undefined;

      setModalData({
        id: savedSub?.id,
        status: evalResponse.verdict,
        runtimeMs: evalResponse.totalDurationMs,
        memoryBytes: 2048,
        passedTestCases: evalResponse.passedTestsCount,
        totalTestCases: evalResponse.totalTestsCount,
        testResultsDetail: detailedResults,
        nextProblemSlug: nextSlug,
      });
      setIsModalOpen(true);

      // Refresh submissions history
      fetchSubmissions();
    } catch (err: any) {
      console.error("Submission failed:", err);
      const sanitized = sanitizeStackTrace(err?.message || String(err), 1);
      setModalData({
        status: "RUNTIME_ERROR",
        runtimeMs: 0,
        passedTestCases: 0,
        totalTestCases: problem.publicTestCases.length,
        testResultsDetail: [
          {
            testCaseId: "err",
            passed: false,
            logs: [],
            executionTimeMs: 0,
            error: {
              message: sanitized.message,
              line: sanitized.line,
              column: sanitized.column,
              sanitizedStack: sanitized.cleanStack,
            },
          },
        ],
      });
      setIsModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset code to starter template?")) {
      setCode(problem.starterCode);
      setRunResponse(null);
    }
  };

  const toggleHint = (index: number) => {
    setOpenHints((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "MEDIUM":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "HARD":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold">
            <CheckCircle2 className="h-3 w-3" />
            <span>Accepted</span>
          </span>
        );
      case "WRONG_ANSWER":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 text-xs font-semibold">
            <XCircle className="h-3 w-3" />
            <span>Wrong Answer</span>
          </span>
        );
      case "TIME_LIMIT_EXCEEDED":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 text-xs font-semibold">
            <Clock className="h-3 w-3" />
            <span>Time Limit Exceeded</span>
          </span>
        );
      case "SYNTAX_ERROR":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 text-xs font-semibold">
            <AlertOctagon className="h-3 w-3" />
            <span>Syntax Error</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 text-xs font-semibold">
            <AlertTriangle className="h-3 w-3" />
            <span>Runtime Error</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#090d16]">
      {/* Workspace Top Toolbar */}
      <div className="flex h-11 items-center justify-between border-b border-slate-800 bg-[#0c121e] px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/problems"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Problem List</span>
          </Link>
          <span className="text-slate-700">|</span>
          <h1 className="text-sm font-semibold text-slate-200">
            {problem.title}
          </h1>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getDifficultyBadge(
              problem.difficulty
            )}`}
          >
            {problem.difficulty}
          </span>
        </div>
      </div>

      {/* Main Split Body: Left Description / Right Monaco & Output */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Problem Details, Hints, & Submissions */}
        <div className="flex flex-col w-full lg:w-[45%] h-1/2 lg:h-full border-r border-slate-800 bg-[#0a0f1a] overflow-hidden">
          {/* Left Column Tabs */}
          <div className="flex items-center gap-2 px-4 border-b border-slate-800 bg-[#0c121e] h-10">
            <button
              type="button"
              onClick={() => setActiveTab("description")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t border-b-2 transition-all ${
                activeTab === "description"
                  ? "border-blue-500 text-blue-400 bg-slate-800/40"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Description</span>
            </button>

            {problem.hints && problem.hints.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("hints")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t border-b-2 transition-all ${
                  activeTab === "hints"
                    ? "border-blue-500 text-blue-400 bg-slate-800/40"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
                <span>Hints ({problem.hints.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveTab("submissions");
                fetchSubmissions();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t border-b-2 transition-all ${
                activeTab === "submissions"
                  ? "border-blue-500 text-blue-400 bg-slate-800/40"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <History className="h-3.5 w-3.5 text-blue-400" />
              <span>Submissions</span>
            </button>
          </div>

          {/* Left Column Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 text-sm text-slate-300 space-y-5">
            {activeTab === "description" && (
              <>
                {/* Topic Tags */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {problem.topicTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-800/70 border border-slate-700/60 px-2 py-0.5 text-xs text-slate-300"
                    >
                      <Tag className="h-3 w-3 text-blue-400" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>

                {/* Formatted Problem Description */}
                <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                  {problem.description}
                </div>
              </>
            )}

            {activeTab === "hints" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 mb-2">
                  Need a nudge? Expand hints one by one to avoid spoiling the
                  complete solution.
                </p>
                {problem.hints.map((hint, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-800 bg-slate-900/60 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleHint(idx)}
                      className="flex w-full items-center justify-between p-3 text-left text-xs font-semibold text-slate-300 hover:bg-slate-800/50 transition-colors"
                    >
                      <span>Hint {idx + 1}</span>
                      {openHints[idx] ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                    {openHints[idx] && (
                      <div className="p-3 pt-0 text-xs text-slate-300 border-t border-slate-800/60 bg-slate-950/40">
                        {hint}
                      </div>
                    )}
                  </div>
                ))}

                {/* Socratic AI Tutor Interactive Guidance Card */}
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 mt-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="h-4 w-4 text-blue-400" />
                    <span className="text-xs font-semibold text-blue-300">
                      Want interactive Socratic guidance?
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                    Our AI Tutor provides 3 levels of progressive hints, error diagnosis, and pattern recommendations without spoiling code.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAITutorOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 text-xs font-semibold shadow-md shadow-blue-600/20 transition-all active:scale-95"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Open Socratic AI Tutor</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "submissions" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Submission History
                  </h3>
                  <button
                    type="button"
                    onClick={fetchSubmissions}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Refresh
                  </button>
                </div>

                {isLoadingSubmissions ? (
                  <div className="flex items-center justify-center py-12 text-slate-500 gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                    <span className="text-xs">Loading past submissions...</span>
                  </div>
                ) : submissionsHistory.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-400">
                    <History className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-300">
                      No submissions recorded yet
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Write your solution and click &quot;Submit&quot; to test against
                      all test cases.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {submissionsHistory.map((sub) => {
                      const isExpanded = expandedSubmissionId === sub.id;
                      return (
                        <div
                          key={sub.id}
                          className="rounded-lg border border-slate-800 bg-slate-900/60 overflow-hidden hover:border-slate-700 transition-colors"
                        >
                          <div
                            onClick={() =>
                              setExpandedSubmissionId(isExpanded ? null : sub.id)
                            }
                            className="flex items-center justify-between p-3 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2.5">
                              {getStatusBadge(sub.status)}
                              <span className="text-xs font-mono text-slate-400">
                                {sub.passedTestCases} / {sub.totalTestCases}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              {sub.runtimeMs !== undefined && (
                                <span className="font-mono text-slate-300">
                                  {sub.runtimeMs}ms
                                </span>
                              )}
                              <span className="text-[11px] text-slate-500">
                                {new Date(sub.submittedAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {isExpanded && sub.code && (
                            <div className="p-3 pt-0 border-t border-slate-800/80 bg-slate-950/50">
                              <div className="flex items-center justify-between text-[11px] text-slate-400 py-1 mb-1">
                                <span className="flex items-center gap-1 font-medium">
                                  <Code2 className="h-3 w-3 text-blue-400" />
                                  Submitted Code
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setCode(sub.code)}
                                  className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                                >
                                  Load into editor
                                </button>
                              </div>
                              <pre className="p-2.5 rounded bg-slate-950 font-mono text-[11px] text-slate-300 overflow-x-auto border border-slate-800 max-h-40">
                                {sub.code}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Editor & Output Panel */}
        <div className="flex flex-col w-full lg:w-[55%] h-1/2 lg:h-full overflow-hidden">
          {/* Top of right column: Header & Monaco Editor */}
          <div className="flex flex-col h-[55%] border-b border-slate-800 overflow-hidden">
            <EditorHeader
              problemTitle={problem.title}
              difficulty={problem.difficulty}
              isRunning={isRunning}
              isSubmitting={isSubmitting}
              onRun={handleRun}
              onSubmit={handleSubmit}
              onReset={handleReset}
              executionTimeMs={runResponse?.totalDurationMs}
              onToggleAITutor={() => setIsAITutorOpen((prev) => !prev)}
              isAITutorOpen={isAITutorOpen}
            />
            <div className="flex-1 w-full overflow-hidden">
              <MonacoCodeEditor
                value={code}
                onChange={setCode}
                language="javascript"
                astMetrics={astMetrics}
              />
            </div>
          </div>

          {/* Bottom of right column: Output & Analysis Panel */}
          <div className="flex-1 h-[45%] overflow-hidden">
            <OutputPanel
              response={runResponse}
              isRunning={isRunning}
              testCases={problem.publicTestCases}
              astMetrics={astMetrics}
              benchmarkPoints={benchmarkPoints}
              estimatedBigO={estimatedBigO}
              optimalBigO={problem.optimalBigO || "O(N)"}
              complexityConfidence={complexityConfidence}
              complexityExplanation={complexityExplanation}
              isBenchmarking={isBenchmarking}
              onRunBenchmark={runBenchmarks}
              activeTab={bottomTab}
              onTabChange={setBottomTab}
            />
          </div>
        </div>
      </div>

      {/* Submission Verdict Modal */}
      <SubmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        submission={modalData}
      />

      {/* Socratic AI Tutor Slide-over Drawer */}
      <AITutorPanel
        isOpen={isAITutorOpen}
        onClose={() => setIsAITutorOpen(false)}
        problemSlug={problem.slug}
        problemTitle={problem.title}
        userCode={code}
        errorContext={
          runResponse?.results?.find((r) => !r.passed)?.error?.message ||
          (runResponse?.verdict && runResponse.verdict !== "ACCEPTED"
            ? `Verdict: ${runResponse.verdict}`
            : undefined)
        }
      />
    </div>
  );
};
