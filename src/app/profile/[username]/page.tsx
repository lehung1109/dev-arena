import React from "react";
import Link from "next/link";
import {
  Flame,
  Trophy,
  Shield,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Award,
  ChevronLeft,
  Terminal,
  ExternalLink,
} from "lucide-react";
import { BadgeList } from "@/components/profile/BadgeList";
import {
  evaluateBadges,
  getRatingTier,
  SEEDED_CONTESTS,
} from "@/lib/contests/rating-engine";
import { getSolvedProblemIds } from "@/lib/db/submissions-store";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);

  // 1. Gather User Stats (Database or seeded profile)
  let userRating = 1350;
  let streakCount = 5;
  let totalSolved = 14;
  let contestRanks: number[] = [2, 5];
  let avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${decodedUsername}`;
  let createdAt = "September 2026";

  // Check in-memory solved set
  const solvedSet = getSolvedProblemIds();
  if (solvedSet.size > 0) {
    totalSolved = Math.max(totalSolved, solvedSet.size);
  }

  // Known profiles customization
  if (decodedUsername === "alexchen") {
    userRating = 1884;
    streakCount = 21;
    totalSolved = 88;
    contestRanks = [1, 1, 3, 2];
    createdAt = "August 2026";
  } else if (decodedUsername === "sjenkins") {
    userRating = 1740;
    streakCount = 14;
    totalSolved = 62;
    contestRanks = [2, 3, 4];
  } else if (decodedUsername === "champion_dev") {
    userRating = 2050;
    streakCount = 42;
    totalSolved = 135;
    contestRanks = [1, 1, 1, 2];
  }

  // Check DB for actual user record
  try {
    if (
      process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.includes("mock_pass")
    ) {
      const dbUser = await db.query.users.findFirst({
        where: eq(users.username, decodedUsername),
      });
      if (dbUser) {
        userRating = dbUser.rating;
        streakCount = dbUser.streakCount;
        totalSolved = Math.max(totalSolved, dbUser.totalSolved);
        if (dbUser.avatarUrl) avatarUrl = dbUser.avatarUrl;
        if (dbUser.createdAt) {
          createdAt = new Date(dbUser.createdAt).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          });
        }
      }
    }
  } catch {
    // Continue with in-memory fallback
  }

  const ratingInfo = getRatingTier(userRating);
  const badges = evaluateBadges({
    streakCount,
    totalSolved,
    rating: userRating,
    contestRanks,
  });

  // Calculate difficulty solve counts (realistic distribution)
  const easySolved = Math.min(15, Math.ceil(totalSolved * 0.5));
  const medSolved = Math.min(20, Math.floor(totalSolved * 0.4));
  const hardSolved = Math.max(0, totalSolved - easySolved - medSolved);

  const easyTotal = 15;
  const medTotal = 20;
  const hardTotal = 10;

  // Rating Progression History Points
  const history = [
    { label: "Start", contest: "Initial", rating: 1200 },
    { label: "Sep 02", contest: "Beginner Cup", rating: userRating >= 1500 ? 1420 : 1230 },
    { label: "Sep 08", contest: "Weekly Arena 1", rating: userRating >= 1800 ? 1680 : userRating >= 1500 ? 1520 : 1290 },
    { label: "Sep 15", contest: "Bi-Weekly Arena", rating: userRating },
  ];

  // SVG dimensions for Rating progression chart
  const chartWidth = 600;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 25;

  const minRating = 1100;
  const maxRating = Math.max(2200, userRating + 100);

  const points = history.map((item, index) => {
    const x =
      paddingX +
      (index / (history.length - 1)) * (chartWidth - paddingX * 2);
    const y =
      chartHeight -
      paddingY -
      ((item.rating - minRating) / (maxRating - minRating)) *
        (chartHeight - paddingY * 2);
    return { x, y, ...item };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x},${
    chartHeight - paddingY
  } L ${points[0].x},${chartHeight - paddingY} Z`;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Back Link */}
        <Link
          href="/contests"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Contests Arena</span>
        </Link>

        {/* Profile Header Card */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt={decodedUsername}
                  className="w-20 h-20 rounded-2xl bg-slate-800 border-2 border-slate-700 p-1 shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 p-1 bg-slate-950 rounded-full border border-slate-800">
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
              </div>

              {/* Identity & Badges */}
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {decodedUsername}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${ratingInfo.badgeBg}`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>
                      {ratingInfo.tier} ({userRating})
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Member since {createdAt}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{streakCount} Day Streak</span>
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-blue-400 font-medium">
                    Top {Math.max(1, Math.round(100 - (userRating / 2200) * 100))}% Percentile
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-4 py-3 text-center">
                <div className="text-xs text-slate-400 font-medium">Rating</div>
                <div className="text-xl font-bold text-blue-400 font-mono mt-0.5">
                  {userRating}
                </div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-4 py-3 text-center">
                <div className="text-xs text-slate-400 font-medium">Solved</div>
                <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                  {totalSolved}
                </div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-4 py-3 text-center">
                <div className="text-xs text-slate-400 font-medium">Contests</div>
                <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">
                  {contestRanks.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Row: Rating Chart & Difficulty Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rating History Chart (2 cols) */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <h2 className="text-base font-bold text-white">Rating Progression</h2>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Peak: <strong className="text-slate-200">{userRating}</strong>
                </span>
              </div>

              {/* Responsive SVG Chart */}
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-44 select-none"
                >
                  <defs>
                    <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line
                    x1={paddingX}
                    y1={chartHeight - paddingY}
                    x2={chartWidth - paddingX}
                    y2={chartHeight - paddingY}
                    stroke="#1e293b"
                    strokeWidth="1"
                  />
                  <line
                    x1={paddingX}
                    y1={paddingY}
                    x2={chartWidth - paddingX}
                    y2={paddingY}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />

                  {/* Area fill */}
                  <path d={areaD} fill="url(#ratingGrad)" />

                  {/* Connecting Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points */}
                  {points.map((pt, i) => (
                    <g key={i}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="4.5"
                        className="fill-blue-500 stroke-slate-950 stroke-2"
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 10}
                        textAnchor="middle"
                        className="text-[10px] font-mono fill-slate-300 font-semibold"
                      >
                        {pt.rating}
                      </text>
                      <text
                        x={pt.x}
                        y={chartHeight - 8}
                        textAnchor="middle"
                        className="text-[10px] font-mono fill-slate-500"
                      >
                        {pt.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>Standard Elo K-factor: 32</span>
              <span className="text-blue-400">Next tier: {ratingInfo.tier === "Grandmaster" ? "Max Tier" : "+150 pts"}</span>
            </div>
          </div>

          {/* Difficulty Solved Breakdown (1 col) */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Solved Problems</span>
              </h2>

              <div className="space-y-4">
                {/* Easy */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-emerald-400">Easy</span>
                    <span className="text-slate-400 font-mono">
                      {easySolved} / {easyTotal}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.round((easySolved / easyTotal) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Medium */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-amber-400">Medium</span>
                    <span className="text-slate-400 font-mono">
                      {medSolved} / {medTotal}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.round((medSolved / medTotal) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Hard */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-rose-400">Hard</span>
                    <span className="text-slate-400 font-mono">
                      {hardSolved} / {hardTotal}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${Math.round((hardSolved / hardTotal) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <Link
                href="/problems"
                className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Solve More Challenges</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Row: Achievement Badges */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl">
          <BadgeList badges={badges} />
        </div>
      </div>
    </div>
  );
}
