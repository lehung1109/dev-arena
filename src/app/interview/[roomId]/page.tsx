"use client";

import React, { useState, useEffect, useRef, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Users,
  UserCheck,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FileText,
  Award,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Terminal,
  MessageSquare,
  Sparkles,
  BookOpen,
  Edit3,
} from "lucide-react";
import { MonacoCodeEditor } from "@/components/editor/MonacoCodeEditor";
import { WorkerRunnerManager } from "@/lib/runner/WorkerRunnerManager";
import { SEED_PROBLEMS } from "@/lib/db/seeds/seed-problems";
import {
  formatInterviewTimer,
  toggleUserRole,
  updateRubricScore,
  calculateRubricAverage,
  getRubricRecommendation,
  DEFAULT_INTERVIEW_RUBRIC,
  RUBRIC_METADATA,
  type InterviewRole,
  type InterviewRubric,
  type InterviewRubricCategory,
} from "@/lib/interview/room-state";
import type { RunCodeResponse, TestCasePayload } from "@/types/runner";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

interface ChatMessage {
  id: string;
  senderRole: InterviewRole;
  senderName: string;
  text: string;
  timestamp: string;
}

function InterviewRoomContent({ roomId }: { roomId: string }) {
  const searchParams = useSearchParams();
  const initialProblemSlug = searchParams.get("problem") || "two-sum";
  const initialRole = (searchParams.get("role") as InterviewRole) || "candidate";

  // Problem Selection
  const [selectedSlug, setSelectedSlug] = useState(initialProblemSlug);
  const currentProblem =
    SEED_PROBLEMS.find((p) => p.slug === selectedSlug) || SEED_PROBLEMS[0];

  // Role & Timer State
  const [role, setRole] = useState<InterviewRole>(initialRole);
  const [timerSeconds, setTimerSeconds] = useState(2700); // 45 minutes
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Layout Tabs
  const [leftTab, setLeftTab] = useState<"prompt" | "hints" | "rubric">("prompt");
  const [rightTab, setRightTab] = useState<"output" | "chat" | "scratchpad">(
    "output"
  );
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});

  // Editor & Runner State
  const [code, setCode] = useState(currentProblem.starterCode);
  const [isRunning, setIsRunning] = useState(false);
  const [runResponse, setRunResponse] = useState<RunCodeResponse | null>(null);
  const [activeTestCaseIdx, setActiveTestCaseIdx] = useState(0);
  const runnerRef = useRef<WorkerRunnerManager | null>(null);

  // Evaluation Rubric State
  const [rubric, setRubric] = useState<InterviewRubric>(
    JSON.parse(JSON.stringify(DEFAULT_INTERVIEW_RUBRIC))
  );

  // Collaboration Chat & Scratchpad
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      senderRole: "interviewer",
      senderName: "Interviewer",
      text: "Welcome to the technical session! Feel free to read through the prompt and ask any clarifying questions before coding.",
      timestamp: "10:00 AM",
    },
    {
      id: "msg-2",
      senderRole: "candidate",
      senderName: "Candidate",
      text: "Thanks! I'm reviewing the constraints. Are all integer values guaranteed to fit in standard JavaScript Number safe range?",
      timestamp: "10:01 AM",
    },
  ]);
  const [messageInput, setMessageInput] = useState("");
  const [scratchpad, setScratchpad] = useState(
    `// ================================================\n// INTERVIEW SCRATCHPAD & WHITEBOARD\n// ================================================\n// 1. Clarifying Questions:\n//    - Input range: -10^9 to 10^9\n//    - Exactly one valid solution guaranteed\n//\n// 2. High-Level Approach:\n//    - Option A: Brute force nested loops (O(N^2) Time, O(1) Space)\n//    - Option B: Hash map lookup (O(N) Time, O(N) Space) <-- Optimal\n//\n// 3. Complexity Target:\n//    - Time: O(N)\n//    - Space: O(N)\n`
  );

  // Initialize WorkerRunnerManager
  useEffect(() => {
    runnerRef.current = new WorkerRunnerManager();
    return () => {
      runnerRef.current?.terminate();
      runnerRef.current = null;
    };
  }, []);

  // Update editor code when problem changes
  useEffect(() => {
    setCode(currentProblem.starterCode);
    setRevealedHints({});
    setRunResponse(null);
  }, [currentProblem]);

  // Countdown timer tick
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleCopyInvite = () => {
    const url = typeof window !== "undefined" ? window.location.href : roomId;
    navigator.clipboard.writeText(url);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleToggleTimer = () => {
    setIsTimerRunning((prev) => !prev);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(2700);
  };

  const handleRunCode = async () => {
    if (isRunning || !runnerRef.current) return;

    setIsRunning(true);
    setRightTab("output");

    const publicCases: TestCasePayload[] = (currentProblem.testCases || [])
      .filter((tc) => tc.isPublic)
      .map((tc, idx) => ({
        id: `tc-${idx}`,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isPublic: true,
        orderIndex: tc.orderIndex ?? idx,
        explanation: tc.explanation,
      }));

    try {
      const response = await runnerRef.current.runCode({
        action: "RUN",
        code,
        functionName: currentProblem.functionName,
        testCases: publicCases,
        timeoutMs: 2000,
      });
      setRunResponse(response);
    } catch (err: any) {
      console.error("Execution error:", err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderRole: role,
      senderName: role === "candidate" ? "Candidate" : "Interviewer",
      text: messageInput.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setMessageInput("");
  };

  const rubricAverage = calculateRubricAverage(rubric);
  const recommendation = getRubricRecommendation(rubricAverage);

  const getTimerColorClass = () => {
    if (timerSeconds <= 300) return "text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse";
    if (timerSeconds <= 600) return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-blue-400 bg-blue-500/10 border-blue-500/30";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#090d16] text-slate-100">
      {/* ------------------------------------------------------------------- */}
      {/* TOP ROOM HEADER BAR                                                  */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-[#0c121e] px-4 py-2 gap-2 text-xs">
        {/* Left: Navigation & Room Code */}
        <div className="flex items-center gap-3">
          <Link
            href="/interview"
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Lobby</span>
          </Link>

          <span className="text-slate-700">|</span>

          {/* Room Code Badge & Copy */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80">
            <span className="text-slate-400">Room:</span>
            <span className="font-mono font-bold text-slate-200">{roomId}</span>
            <button
              type="button"
              onClick={handleCopyInvite}
              className="ml-1 p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
              title="Copy invite URL"
            >
              {copiedInvite ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {copiedInvite && (
            <span className="text-[10px] text-emerald-400 font-semibold animate-fade-in">
              Invite Link Copied!
            </span>
          )}
        </div>

        {/* Center: 45-minute Countdown Timer */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-mono font-bold text-sm ${getTimerColorClass()}`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatInterviewTimer(timerSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={handleToggleTimer}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={isTimerRunning ? "Pause Timer" : "Resume Timer"}
          >
            {isTimerRunning ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={handleResetTimer}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Reset to 45m"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Active Role Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] hidden md:inline">Your Role:</span>
          <button
            type="button"
            onClick={() => setRole(toggleUserRole(role))}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
              role === "candidate"
                ? "bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-sm shadow-blue-500/10"
                : "bg-purple-600/20 text-purple-300 border-purple-500/50 shadow-sm shadow-purple-500/10"
            }`}
          >
            {role === "candidate" ? (
              <>
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Candidate Mode</span>
              </>
            ) : (
              <>
                <Award className="w-3.5 h-3.5 text-purple-400" />
                <span>Interviewer Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* MAIN SPLIT PANELS                                                   */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* ================================================================= */}
        {/* LEFT PANEL: Problem Prompt, Hints, & Evaluation Rubric            */}
        {/* ================================================================= */}
        <div className="flex flex-col w-full lg:w-[45%] h-1/2 lg:h-full border-r border-slate-800 bg-[#0a0f1a] overflow-hidden">
          {/* Left Panel Tabs Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-[#0c121e] px-3 h-10">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLeftTab("prompt")}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-t border-b-2 transition-all ${
                  leftTab === "prompt"
                    ? "border-blue-500 text-blue-400 bg-slate-800/40"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Problem</span>
              </button>

              <button
                type="button"
                onClick={() => setLeftTab("hints")}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-t border-b-2 transition-all ${
                  leftTab === "hints"
                    ? "border-blue-500 text-blue-400 bg-slate-800/40"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Hints ({currentProblem.hints?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setLeftTab("rubric")}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-t border-b-2 transition-all ${
                  leftTab === "rubric"
                    ? "border-purple-500 text-purple-400 bg-slate-800/40"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Award className="w-3.5 h-3.5 text-purple-400" />
                <span>Rubric ({rubricAverage.toFixed(1)})</span>
              </button>
            </div>

            {/* Problem Switcher Dropdown */}
            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="text-[11px] bg-slate-900 border border-slate-700 text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
            >
              {SEED_PROBLEMS.map((prob) => (
                <option key={prob.slug} value={prob.slug}>
                  {prob.title}
                </option>
              ))}
            </select>
          </div>

          {/* Left Panel Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 text-sm text-slate-300 space-y-4">
            {/* TAB 1: Problem Prompt */}
            {leftTab === "prompt" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white">
                    {currentProblem.title}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      currentProblem.difficulty === "EASY"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : currentProblem.difficulty === "MEDIUM"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {currentProblem.difficulty}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {currentProblem.topicTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-400 border border-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap font-sans text-xs">
                  {currentProblem.description}
                </div>
              </div>
            )}

            {/* TAB 2: Hints & Socratic Guidance */}
            {leftTab === "hints" && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Interview Tip: Discuss concepts out loud before revealing hints. The
                    interviewer may choose to release hints incrementally.
                  </span>
                </div>

                {currentProblem.hints && currentProblem.hints.length > 0 ? (
                  currentProblem.hints.map((hint, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-800 bg-slate-900/60 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setRevealedHints((prev) => ({
                            ...prev,
                            [idx]: !prev[idx],
                          }))
                        }
                        className="flex w-full items-center justify-between p-3 text-left text-xs font-semibold text-slate-300 hover:bg-slate-800/50"
                      >
                        <span>Hint {idx + 1}</span>
                        {revealedHints[idx] ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                      {revealedHints[idx] && (
                        <div className="px-3 pb-3 text-xs text-slate-400 border-t border-slate-800/80 pt-2 leading-relaxed">
                          {hint}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No hints available for this problem.</p>
                )}
              </div>
            )}

            {/* TAB 3: Interviewer Rubric & Live Evaluation */}
            {leftTab === "rubric" && (
              <div className="space-y-4">
                {/* Rubric Summary Card */}
                <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/20 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-purple-300 font-semibold uppercase tracking-wider">
                      Overall Assessment
                    </div>
                    <div className="text-lg font-bold text-white flex items-center gap-2">
                      <span>{rubricAverage.toFixed(1)} / 5.0</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-semibold ${
                          recommendation.includes("HIRE") && !recommendation.includes("NO")
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        }`}
                      >
                        {recommendation.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rubric Categories */}
                {(
                  [
                    "problemSolving",
                    "coding",
                    "communication",
                    "verification",
                  ] as InterviewRubricCategory[]
                ).map((categoryKey) => {
                  const meta = RUBRIC_METADATA[categoryKey];
                  const currentCategory = rubric[categoryKey];

                  return (
                    <div
                      key={categoryKey}
                      className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">
                          {meta.label}
                        </span>
                        {/* Rating Buttons 1..5 */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() =>
                                setRubric((prev) =>
                                  updateRubricScore(prev, categoryKey, val)
                                )
                              }
                              className={`w-6 h-6 rounded text-[11px] font-bold transition-all ${
                                currentCategory.score === val
                                  ? "bg-purple-600 text-white shadow-sm shadow-purple-500/30"
                                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-tight">
                        {meta.description}
                      </p>

                      {/* Notes input */}
                      <input
                        type="text"
                        value={currentCategory.notes}
                        onChange={(e) =>
                          setRubric((prev) =>
                            updateRubricScore(
                              prev,
                              categoryKey,
                              currentCategory.score,
                              e.target.value
                            )
                          )
                        }
                        placeholder="Observation notes..."
                        className="w-full px-2.5 py-1 text-xs rounded bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT PANEL: Editor, Runner Output, & Live Chat/Notes            */}
        {/* ================================================================= */}
        <div className="flex flex-col w-full lg:w-[55%] h-1/2 lg:h-full overflow-hidden">
          {/* Top Half: Monaco Code Editor */}
          <div className="flex flex-col h-[55%] border-b border-slate-800 overflow-hidden">
            {/* Editor Action Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-[#0c121e] px-4 h-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-slate-300">
                  JavaScript (Node.js Sandbox)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCode(currentProblem.starterCode)}
                  className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Reset Code
                </button>

                <button
                  type="button"
                  disabled={isRunning}
                  onClick={handleRunCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/25 transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunning ? "Running..." : "Run Code"}</span>
                </button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 w-full overflow-hidden">
              <MonacoCodeEditor
                value={code}
                onChange={setCode}
                language="javascript"
              />
            </div>
          </div>

          {/* Bottom Half: Tabs for Runner Output, Chat & Scratchpad */}
          <div className="flex flex-col h-[45%] bg-[#080d16] overflow-hidden">
            {/* Bottom Tabs Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-[#0c121e] px-3 h-9">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setRightTab("output")}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-t border-b-2 transition-all ${
                    rightTab === "output"
                      ? "border-emerald-500 text-emerald-400 bg-slate-800/40"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Execution Output</span>
                  {runResponse && (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        runResponse.verdict === "ACCEPTED"
                          ? "bg-emerald-400"
                          : "bg-rose-400"
                      }`}
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setRightTab("chat")}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-t border-b-2 transition-all ${
                    rightTab === "chat"
                      ? "border-blue-500 text-blue-400 bg-slate-800/40"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Session Chat ({chatMessages.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRightTab("scratchpad")}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-t border-b-2 transition-all ${
                    rightTab === "scratchpad"
                      ? "border-purple-500 text-purple-400 bg-slate-800/40"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Whiteboard / Notes</span>
                </button>
              </div>
            </div>

            {/* Bottom Panel Content */}
            <div className="flex-1 overflow-y-auto p-3 text-xs">
              {/* TAB: OUTPUT */}
              {rightTab === "output" && (
                <div>
                  {!runResponse ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-center">
                      <Terminal className="w-8 h-8 mb-2 text-slate-600" />
                      <p className="font-medium text-slate-400">
                        No execution results yet
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Click &quot;Run Code&quot; above to execute your solution against test cases.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Verdict Banner */}
                      <div
                        className={`flex items-center justify-between p-2.5 rounded-lg border ${
                          runResponse.verdict === "ACCEPTED"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {runResponse.verdict === "ACCEPTED" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          )}
                          <span className="font-bold text-xs">
                            {runResponse.verdict}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {runResponse.passedTestsCount} / {runResponse.totalTestsCount} passed ({runResponse.totalDurationMs}ms)
                        </div>
                      </div>

                      {/* Test Case Selectors */}
                      <div className="flex gap-1.5">
                        {runResponse.results.map((res, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveTestCaseIdx(idx)}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                              activeTestCaseIdx === idx
                                ? "bg-slate-700 border-slate-600 text-white"
                                : "bg-slate-900 border-slate-800 text-slate-400"
                            }`}
                          >
                            Case {idx + 1}{" "}
                            {res.passed ? "✓" : "✗"}
                          </button>
                        ))}
                      </div>

                      {/* Active Test Case Detail */}
                      {runResponse.results[activeTestCaseIdx] && (
                        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950 font-mono text-[11px] space-y-2">
                          <div>
                            <span className="text-slate-500 block mb-0.5">Expected:</span>
                            <div className="p-1.5 rounded bg-slate-900 text-slate-200">
                              {JSON.stringify(runResponse.results[activeTestCaseIdx].expectedOutput)}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-500 block mb-0.5">Actual Output:</span>
                            <div className="p-1.5 rounded bg-slate-900 text-slate-200">
                              {JSON.stringify(runResponse.results[activeTestCaseIdx].actualOutput)}
                            </div>
                          </div>
                          {runResponse.results[activeTestCaseIdx].logs.length > 0 && (
                            <div>
                              <span className="text-slate-500 block mb-0.5">Stdout Logs:</span>
                              <div className="p-1.5 rounded bg-slate-900 text-amber-300">
                                {runResponse.results[activeTestCaseIdx].logs.join("\n")}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: CHAT */}
              {rightTab === "chat" && (
                <div className="flex flex-col h-full space-y-2">
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-2 rounded-lg border max-w-[85%] ${
                          msg.senderRole === "candidate"
                            ? "bg-blue-950/40 border-blue-800/40 ml-auto text-blue-100"
                            : "bg-purple-950/40 border-purple-800/40 mr-auto text-purple-100"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-semibold text-slate-300">
                            {msg.senderName}
                          </span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <p className="text-xs leading-relaxed">{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-800">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder={`Send message as ${role}...`}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}

              {/* TAB: SCRATCHPAD */}
              {rightTab === "scratchpad" && (
                <div className="h-full flex flex-col">
                  <textarea
                    value={scratchpad}
                    onChange={(e) => setScratchpad(e.target.value)}
                    placeholder="Write pseudo-code, notes, or trace variables here..."
                    className="flex-1 w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InterviewRoomPage({ params }: PageProps) {
  const { roomId } = use(params);

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#090d16] text-slate-400 text-xs">
          Loading Mock Interview Room...
        </div>
      }
    >
      <InterviewRoomContent roomId={roomId} />
    </Suspense>
  );
}
