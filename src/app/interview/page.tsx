"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Video,
  Terminal,
  Play,
  CheckCircle2,
  Clock,
  Award,
  Shield,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  HelpCircle,
  Code2,
  RefreshCw,
  MessageSquare,
  Compass,
} from "lucide-react";
import {
  generateRoomCode,
  isValidRoomCode,
  RUBRIC_METADATA,
} from "@/lib/interview/room-state";

export default function InterviewLobbyPage() {
  const router = useRouter();
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [selectedInitialProblem, setSelectedInitialProblem] = useState("two-sum");

  const handleCreateRoom = () => {
    const newCode = generateRoomCode();
    router.push(`/interview/${newCode}?problem=${selectedInitialProblem}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCodeInput.trim().toLowerCase();

    if (!isValidRoomCode(cleanCode)) {
      setJoinError("Invalid room code format. Expected 'room-xxxxxx' (e.g. room-a1b2c3)");
      return;
    }

    setJoinError(null);
    router.push(`/interview/${cleanCode}`);
  };

  const handleQuickMatch = () => {
    setIsMatching(true);
    setTimeout(() => {
      const matchCode = generateRoomCode();
      router.push(`/interview/${matchCode}?problem=${selectedInitialProblem}&role=candidate`);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Hero Header */}
      <div className="relative border-b border-slate-800/80 bg-gradient-to-b from-indigo-950/20 via-[#090d16] to-[#090d16] px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>Peer Mock Interview Arena</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Technical Mock Interviews
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 mt-1">
              Practice Under Realistic Pressure
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed">
            Step into the candidate hot seat or practice interviewing peers. Solve real DSA
            problems in a synchronized code environment with live 45-minute countdowns and
            structured Big-Tech rubric scoring.
          </p>
        </div>
      </div>

      {/* Main Actions Cards Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Create Private Room */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d1424] p-6 shadow-xl flex flex-col justify-between hover:border-indigo-500/40 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Create Private Room</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate an exclusive session code, choose a problem, and invite a study
                buddy or mentor to run a 45-minute technical simulation.
              </p>

              {/* Problem Selection dropdown */}
              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Starting Problem
                </label>
                <select
                  value={selectedInitialProblem}
                  onChange={(e) => setSelectedInitialProblem(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="two-sum">Two Sum (Easy - Hash Table)</option>
                  <option value="valid-parentheses">Valid Parentheses (Easy - Stack)</option>
                  <option value="reverse-linked-list">Reverse Linked List (Easy - Pointers)</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateRoom}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
            >
              <span>Launch Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Quick Match with Peer */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d1424] p-6 shadow-xl flex flex-col justify-between hover:border-blue-500/40 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Quick Match with Peer</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatically match with another student or developer ready to practice right
                now. Take turns interviewing each other.
              </p>

              <div className="flex items-center gap-2 pt-2 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active Queue: Instant Matching</span>
              </div>
            </div>

            <button
              type="button"
              disabled={isMatching}
              onClick={handleQuickMatch}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50"
            >
              {isMatching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Finding Peer Partner...</span>
                </>
              ) : (
                <>
                  <span>Find Study Partner</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Card 3: Join with Code */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d1424] p-6 shadow-xl flex flex-col justify-between hover:border-purple-500/40 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Join with Code</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Received an invite from a peer? Paste the 6-character room code below to enter
                their interview room immediately.
              </p>

              <form onSubmit={handleJoinRoom} className="space-y-2 pt-2">
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  placeholder="e.g. room-ab12cd"
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                {joinError && (
                  <p className="text-[11px] text-rose-400 leading-tight">{joinError}</p>
                )}

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/25 transition-all"
                >
                  <span>Enter Room</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="mt-4 text-[11px] text-slate-500 text-center">
              Room codes expire after 2 hours of inactivity.
            </div>
          </div>
        </div>
      </div>

      {/* Rubric Evaluation Guide Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
            <Award className="w-3.5 h-3.5" />
            <span>Interview Evaluation Framework</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Industry Standard Evaluation Rubric
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Both candidates and interviewers evaluate performance across four foundational
            pillars calibrated against FAANG engineering hiring standards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(RUBRIC_METADATA).map(([key, category]) => (
            <div
              key={key}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  {category.label}
                </h4>
                <span className="text-[10px] font-semibold uppercase text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                  Weight: 25%
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {category.description}
              </p>

              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-300">
                  Key signals to demonstrate:
                </div>
                {category.tips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-400"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preparation Tips Checklist */}
      <div className="border-t border-slate-800/80 bg-slate-950/40 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>For the Candidate</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span>
                  <strong>Clarify first:</strong> Never start coding immediately. Ask about
                  input size, null/empty arrays, and constraints.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span>
                  <strong>Think aloud:</strong> Explain the high-level intuition before
                  writing a single line of JavaScript.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span>
                  <strong>State Big-O early:</strong> Mention anticipated Time & Space
                  complexity before implementing.
                </span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>For the Interviewer</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>
                  <strong>Nudge, don&apos;t give away:</strong> If the candidate is stuck, ask
                  Socratic questions rather than explaining the algorithm.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>
                  <strong>Challenge edge cases:</strong> Ask what happens on $N=0$ or duplicate
                  keys once code is written.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>
                  <strong>Record notes live:</strong> Use the private interviewer rubric panel
                  to score and summarize recommendations.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
