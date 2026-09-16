"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Trophy,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Circle,
  ExternalLink,
  Flame,
  Medal,
  RefreshCw,
  Users,
  Code2,
  TrendingUp,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  SEEDED_CONTESTS,
  type SeededContest,
  type ContestLeaderboardEntry,
} from "@/lib/contests/rating-engine";
import { isProblemSolved } from "@/lib/db/submissions-store";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ContestArenaPage({ params }: PageProps) {
  const { slug } = use(params);

  const [contest, setContest] = useState<SeededContest | null>(null);
  const [leaderboard, setLeaderboard] = useState<ContestLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"PROBLEMS" | "LEADERBOARD">("PROBLEMS");
  const [now, setNow] = useState<number>(Date.now());
  const [refreshing, setRefreshing] = useState(false);

  // Live timer tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch contest details & leaderboard
  async function fetchContestData() {
    try {
      setRefreshing(true);
      // Fallback initial
      const seeded = SEEDED_CONTESTS.find((c) => c.slug === slug);
      if (seeded) {
        setContest(seeded);
        setLeaderboard(seeded.leaderboard);
      }

      // Query API
      const res = await fetch(`/api/contests/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setContest(data);
      }

      const lbRes = await fetch(`/api/contests/${slug}/leaderboard`);
      if (lbRes.ok) {
        const lbData = await lbRes.json();
        if (lbData.leaderboard) {
          setLeaderboard(lbData.leaderboard);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch from API, using seeded contest:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchContestData();
  }, [slug]);

  if (loading && !contest) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          <span>Entering Arena...</span>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center text-slate-300 gap-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h1 className="text-xl font-bold">Contest Not Found</h1>
        <p className="text-sm text-slate-400">Could not find contest with slug &quot;{slug}&quot;.</p>
        <Link
          href="/contests"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Contests</span>
        </Link>
      </div>
    );
  }

  // Format active countdown timer
  function getTimerDisplay() {
    if (!contest) return "";
    const isOngoing = contest.status === "ONGOING";
    const isUpcoming = contest.status === "UPCOMING";
    const targetMs = isOngoing
      ? new Date(contest.endTime).getTime()
      : new Date(contest.startTime).getTime();
    const diff = targetMs - now;

    if (diff <= 0) {
      if (isOngoing) return "00:00:00 (Time Expired)";
      return "00:00:00";
    }

    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }

  const isOngoing = contest.status === "ONGOING";
  const isUpcoming = contest.status === "UPCOMING";
  const isFinished = contest.status === "FINISHED";

  const totalPoints = Object.values(contest.problemWeights || {}).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/contests"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Contests Lobby</span>
          </Link>

          <button
            onClick={fetchContestData}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Sync Live Standings</span>
          </button>
        </div>

        {/* Contest Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                {isOngoing && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>ONGOING COMPETITION</span>
                  </span>
                )}
                {isUpcoming && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <Clock className="w-3 h-3" />
                    <span>UPCOMING ARENA</span>
                  </span>
                )}
                {isFinished && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>CONTEST CONCLUDED</span>
                  </span>
                )}
                <span className="text-xs text-slate-400 font-mono">
                  {contest.durationMinutes} Minutes Duration
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {contest.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {contest.description}
              </p>

              {/* Quick Pills */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <strong className="text-slate-200">{totalPoints}</strong> Total Points
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                  <strong className="text-slate-200">{contest.problemCount}</strong> Challenges
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <strong className="text-slate-200">{contest.participantCount}</strong> Active Coders
                </span>
              </div>
            </div>

            {/* Active Countdown Timer Display */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 text-center min-w-[220px] shadow-lg flex flex-col justify-center">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {isOngoing ? "Time Remaining" : isUpcoming ? "Starts In" : "Arena Status"}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-white mt-1.5 text-center">
                {isFinished ? "00:00:00" : getTimerDisplay()}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {isOngoing ? "ICPC Penalty Mode: 10m per failed attempt" : isUpcoming ? "Registration Confirmed" : "Final Standings Locked"}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("PROBLEMS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "PROBLEMS"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Problem Set ({contest.problemCount})</span>
          </button>
          <button
            onClick={() => setActiveTab("LEADERBOARD")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "LEADERBOARD"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Live Leaderboard ({leaderboard.length})</span>
          </button>
        </div>

        {/* Tab 1: Problems Table */}
        {activeTab === "PROBLEMS" && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Problem</th>
                    <th className="py-3.5 px-6">Difficulty</th>
                    <th className="py-3.5 px-6 text-right">Points</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {contest.problems.map((prob, idx) => {
                    const points = contest.problemWeights[prob.slug] || prob.points || 100;
                    const solved = isProblemSolved(prob.slug) || isProblemSolved(`seed-${prob.slug}`);

                    return (
                      <tr
                        key={prob.id || idx}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Solved Status */}
                        <td className="py-4 px-6">
                          {solved ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Solved</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-slate-500">
                              <Circle className="w-4 h-4" />
                              <span>Unsolved</span>
                            </span>
                          )}
                        </td>

                        {/* Title */}
                        <td className="py-4 px-6">
                          <Link
                            href={`/problems/${prob.slug}?contest=${contest.slug}`}
                            className="font-bold text-slate-100 hover:text-blue-400 transition-colors text-sm"
                          >
                            {prob.title}
                          </Link>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            slug: {prob.slug}
                          </div>
                        </td>

                        {/* Difficulty */}
                        <td className="py-4 px-6">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              prob.difficulty === "EASY"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : prob.difficulty === "MEDIUM"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {prob.difficulty}
                          </span>
                        </td>

                        {/* Points */}
                        <td className="py-4 px-6 text-right font-mono font-bold text-amber-400 text-sm">
                          {points} pts
                        </td>

                        {/* Action Link */}
                        <td className="py-4 px-6 text-right">
                          <Link
                            href={`/problems/${prob.slug}?contest=${contest.slug}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors shadow-sm shadow-blue-600/20"
                          >
                            <span>Solve</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Live Leaderboard */}
        {activeTab === "LEADERBOARD" && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span>Real-Time Arena Leaderboard</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sorted by Score DESC, then ICPC Penalty Minutes ASC.
                </p>
              </div>

              <div className="text-xs text-slate-400 font-mono">
                {leaderboard.length} Competitors Ranked
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">Rank</th>
                    <th className="py-3 px-4">Participant</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4 text-center">Penalty</th>
                    <th className="py-3 px-4 text-center">Elo Delta</th>
                    {contest.problems.map((p) => (
                      <th key={p.slug} className="py-3 px-4 text-center">
                        {p.title.split(" ")[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {leaderboard.map((row) => {
                    const isTop1 = row.rank === 1;
                    const isTop2 = row.rank === 2;
                    const isTop3 = row.rank === 3;

                    return (
                      <tr
                        key={row.userId}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isTop1 ? "bg-amber-500/5" : ""
                        }`}
                      >
                        {/* Rank Badge */}
                        <td className="py-3.5 px-4 text-center">
                          {isTop1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold font-mono border border-amber-500/40">
                              🥇
                            </span>
                          ) : isTop2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300/20 text-slate-300 font-bold font-mono border border-slate-300/40">
                              🥈
                            </span>
                          ) : isTop3 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 font-bold font-mono border border-amber-700/40">
                              🥉
                            </span>
                          ) : (
                            <span className="font-mono text-slate-400 font-semibold">
                              #{row.rank}
                            </span>
                          )}
                        </td>

                        {/* User Profile */}
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/profile/${row.username}`}
                            className="inline-flex items-center gap-2.5 font-semibold text-slate-200 hover:text-blue-400 transition-colors"
                          >
                            <img
                              src={
                                row.avatarUrl ||
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${row.username}`
                              }
                              alt={row.username}
                              className="w-6 h-6 rounded-full bg-slate-800"
                            />
                            <span>{row.username}</span>
                          </Link>
                        </td>

                        {/* Score */}
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-400">
                          {row.score}
                        </td>

                        {/* Penalty */}
                        <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                          {row.penaltyMinutes}m
                        </td>

                        {/* Rating Delta */}
                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                          {row.ratingDelta !== undefined ? (
                            row.ratingDelta > 0 ? (
                              <span className="text-emerald-400">
                                +{row.ratingDelta}
                              </span>
                            ) : row.ratingDelta < 0 ? (
                              <span className="text-rose-400">
                                {row.ratingDelta}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        {/* Problem-by-problem breakdown */}
                        {contest.problems.map((p) => {
                          const stat = row.problemStats?.[p.slug];
                          if (!stat) {
                            return (
                              <td
                                key={p.slug}
                                className="py-3.5 px-4 text-center text-slate-600 font-mono"
                              >
                                —
                              </td>
                            );
                          }
                          if (stat.solved) {
                            return (
                              <td
                                key={p.slug}
                                className="py-3.5 px-4 text-center font-mono text-emerald-400"
                              >
                                <span className="font-bold">+{stat.attempts}</span>
                                <span className="text-[10px] text-slate-400 ml-1">
                                  ({stat.timeMinutes}m)
                                </span>
                              </td>
                            );
                          }
                          return (
                            <td
                              key={p.slug}
                              className="py-3.5 px-4 text-center font-mono text-rose-400"
                            >
                              -{stat.attempts}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
