"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  BookOpen,
  HelpCircle,
  Tag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { MonacoCodeEditor } from "@/components/editor/MonacoCodeEditor";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { OutputPanel } from "@/components/editor/OutputPanel";
import { WorkerRunnerManager } from "@/lib/runner/WorkerRunnerManager";
import type { RunCodeResponse, TestCasePayload } from "@/types/runner";

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
}

interface ProblemWorkspaceProps {
  problem: ProblemData;
}

export const ProblemWorkspace: React.FC<ProblemWorkspaceProps> = ({
  problem,
}) => {
  const [code, setCode] = useState(problem.starterCode);
  const [isRunning, setIsRunning] = useState(false);
  const [runResponse, setRunResponse] = useState<RunCodeResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "hints">("description");
  const [openHints, setOpenHints] = useState<Record<number, boolean>>({});

  const runnerRef = useRef<WorkerRunnerManager | null>(null);

  useEffect(() => {
    runnerRef.current = new WorkerRunnerManager();
    return () => {
      runnerRef.current?.dispose();
    };
  }, []);

  const handleRun = async () => {
    if (isRunning || !runnerRef.current) return;

    setIsRunning(true);
    try {
      const response = await runnerRef.current.runCode({
        action: "RUN",
        code,
        functionName: problem.functionName,
        testCases: problem.publicTestCases,
        timeoutMs: 2000,
      });
      setRunResponse(response);
    } catch (err: any) {
      setRunResponse({
        action: "RUN",
        verdict: "RUNTIME_ERROR",
        totalDurationMs: 0,
        passedTestsCount: 0,
        totalTestsCount: problem.publicTestCases.length,
        results: problem.publicTestCases.map((tc) => ({
          testCaseId: tc.id,
          passed: false,
          logs: [],
          executionTimeMs: 0,
          error: { message: err?.message || String(err) },
        })),
      });
    } finally {
      setIsRunning(false);
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
        {/* Left Column: Problem Details & Hints */}
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
          </div>

          {/* Left Column Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 text-sm text-slate-300 space-y-5">
            {activeTab === "description" ? (
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
            ) : (
              /* Hints Tab */
              <div className="space-y-3">
                <p className="text-xs text-slate-400 mb-2">
                  Need a nudge? Expand hints one by one to avoid spoiling the complete solution.
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
              onRun={handleRun}
              onReset={handleReset}
              executionTimeMs={runResponse?.totalDurationMs}
            />
            <div className="flex-1 w-full overflow-hidden">
              <MonacoCodeEditor
                value={code}
                onChange={setCode}
                language="javascript"
              />
            </div>
          </div>

          {/* Bottom of right column: Output Panel */}
          <div className="flex-1 h-[45%] overflow-hidden">
            <OutputPanel
              response={runResponse}
              isRunning={isRunning}
              testCases={problem.publicTestCases}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
