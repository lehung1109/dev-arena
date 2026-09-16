"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  Clock,
  Users,
  Code2,
  Calendar,
  ArrowRight,
  Flame,
  CheckCircle2,
  Sparkles,
  Shield,
  Filter,
} from "lucide-react";
import { SEEDED_CONTESTS, type SeededContest } from "@/lib/contests/rating-engine";

export default function ContestsLobbyPage() {
  const [contests, setContests] = useState<SeededContest[]>(SEEDED_CONTESTS);
  const [selectedTab, setSelectedTab] = useState<"ALL" | "ONGOING" | "UPCOMING" | "FINISHED">("ALL");
  const [now, setNow] = useState<number>(Date.now());
  const [loading, setLoading] = useState(false);

  // Live timer tick every 10 seconds for countdown refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch contests from API if available
  useEffect(() => {
    async function loadContests() {
      try {
        setLoading(true);
        const res = await fetch("/api/contests");
        if (res.ok) {
          const data = await res.json();
          if (data.contests && Array.isArray(data.contests)) {
            // merge or set
            setContests(data.contests);
          }
        }
      } catch (err) {
        console.warn("Using seeded contests dataset:", err);
      } finally {
        setLoading(false);
      }
    }
    loadContests();
  }, []);

  const filteredContests =
    selectedTab === "ALL"
      ? contests
      : contests.filter((c) => c.status === selectedTab);

  // Helper to format remaining time
  function formatCountdown(targetTimeStr: string, status: string): string {
    const targetMs = new Date(targetTimeStr).getTime();
    const diffMs = targetMs - now;

    if (status === "FINISHED" || diffMs <= 0) {
      if (status === "ONGOING") return "Ending soon";
      return "Ended";
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  }

  const ongoingCount = contests.filter((c) => c.status === "ONGOING").length;
  const upcomingCount = contests.filter((c) => c.status === "UPCOMING").length;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Banner Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900/80 border border-slate-800/80 p-8 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Official Timed Competitions</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Arena Contests & Rating Standings
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Compete under strict ICPC penalty scoring, test your speed against global algorithmic coders, and level up your Elo rating.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-emerald-400 font-semibold">{ongoingCount} Ongoing Arena</span>
              </span>
              <span className="text-slate-600">&bull;</span>
              <span className="flex items-center gap-1.5 font-medium text-amber-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{upcomingCount} Upcoming</span>
              </span>
              <span className="text-slate-600">&bull;</span>
              <Link
                href="/profile/coder_99"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-4 flex items-center gap-1"
              >
                <span>View My Profile</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            {(["ALL", "ONGOING", "UPCOMING", "FINISHED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedTab === tab
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60"
                }`}
              >
                {tab === "ALL" && "All Contests"}
                {tab === "ONGOING" && "Live Now"}
                {tab === "UPCOMING" && "Upcoming"}
                {tab === "FINISHED" && "Finished"}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400">
            Showing <strong className="text-slate-200">{filteredContests.length}</strong> contests
          </div>
        </div>

        {/* Contest Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContests.map((contest) => {
            const isOngoing = contest.status === "ONGOING";
            const isUpcoming = contest.status === "UPCOMING";
            const isFinished = contest.status === "FINISHED";

            return (
              <div
                key={contest.id}
                className={`flex flex-col justify-between rounded-2xl p-6 border transition-all duration-200 ${
                  isOngoing
                    ? "bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-500/5 hover:border-emerald-500/70"
                    : "bg-slate-900/70 border-slate-800/80 hover:border-slate-700"
                }`}
              >
                <div className="space-y-4">
                  {/* Status Pill & Countdown */}
                  <div className="flex items-center justify-between gap-2">
                    {isOngoing && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>LIVE NOW</span>
                      </span>
                    )}
                    {isUpcoming && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        <Clock className="w-3 h-3" />
                        <span>UPCOMING</span>
                      </span>
                    )}
                    {isFinished && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>FINISHED</span>
                      </span>
                    )}

                    {/* Dynamic Countdown Display */}
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500 font-medium">
                        {isOngoing ? "Ends in" : isUpcoming ? "Starts in" : "Status"}
                      </div>
                      <div className="font-mono text-xs font-bold text-slate-200">
                        {isOngoing && formatCountdown(contest.endTime, "ONGOING")}
                        {isUpcoming && formatCountdown(contest.startTime, "UPCOMING")}
                        {isFinished && "Completed"}
                      </div>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                      {contest.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {contest.description}
                    </p>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-300">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                      <Clock className="w-3 h-3 text-blue-400" />
                      <span>{contest.durationMinutes} mins</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                      <Code2 className="w-3 h-3 text-indigo-400" />
                      <span>{contest.problemCount} Problems</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                      <Users className="w-3 h-3 text-amber-400" />
                      <span>{contest.participantCount}</span>
                    </span>
                  </div>
                </div>

                {/* Card CTA Action */}
                <div className="mt-6 pt-4 border-t border-slate-800/80">
                  {isOngoing && (
                    <Link
                      href={`/contests/${contest.slug}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/20"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Enter Arena</span>
                    </Link>
                  )}
                  {isUpcoming && (
                    <Link
                      href={`/contests/${contest.slug}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
                    >
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <span>Register & View Details</span>
                    </Link>
                  )}
                  {isFinished && (
                    <Link
                      href={`/contests/${contest.slug}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 bg-slate-950 hover:bg-slate-800 hover:text-white transition-colors border border-slate-800"
                    >
                      <Trophy className="w-4 h-4 text-slate-400" />
                      <span>View Results & Standings</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
