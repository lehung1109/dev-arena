/**
 * Rating & Scoring Engine for Timed Contests & Gamification
 * Dev Arena - 001-in-browser-code-arena
 */

export interface ContestSubmission {
  id?: string;
  problemId: string;
  points?: number;
  status: string;
  submittedAt: Date | string;
}

export interface ContestScoreResult {
  score: number;
  penaltyMinutes: number;
  problemStats: Record<
    string,
    {
      solved: boolean;
      attempts: number;
      timeMinutes: number;
    }
  >;
}

export interface ParticipantScore {
  userId: string;
  username: string;
  score: number;
  penaltyMinutes: number;
}

export interface RankedStanding extends ParticipantScore {
  rank: number;
}

export interface RankedParticipant {
  userId: string;
  currentRating: number;
  rank: number;
}

export interface Badge {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  category: "achievement" | "streak" | "contest" | "rating";
  unlocked: boolean;
  unlockedAt?: string;
  progress?: {
    current: number;
    target: number;
  };
}

export interface ContestProblem {
  id: string;
  slug: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  points: number;
}

export interface ContestLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  score: number;
  penaltyMinutes: number;
  ratingDelta?: number;
  problemStats?: Record<
    string,
    {
      solved: boolean;
      attempts: number;
      timeMinutes: number;
    }
  >;
}

export interface SeededContest {
  id: string;
  slug: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: "UPCOMING" | "ONGOING" | "FINISHED";
  durationMinutes: number;
  problemCount: number;
  participantCount: number;
  problemWeights: Record<string, number>;
  problems: ContestProblem[];
  leaderboard: ContestLeaderboardEntry[];
}

/**
 * ICPC Penalty Calculation:
 * - Accepted submission points + 10 min penalty per prior failed attempt.
 * - Submissions after first accepted verdict are ignored.
 * - Unaccepted problems contribute 0 points and 0 penalty minutes.
 */
export function calculateContestScore(
  submissions: ContestSubmission[],
  contestStartTime: Date | string
): ContestScoreResult {
  const startMs = new Date(contestStartTime).getTime();

  // Sort submissions chronologically
  const sorted = [...submissions].sort(
    (a, b) =>
      new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  );

  const problemMap: Record<
    string,
    {
      solved: boolean;
      failedAttempts: number;
      totalAttempts: number;
      timeMinutes: number;
      points: number;
    }
  > = {};

  for (const sub of sorted) {
    if (!problemMap[sub.problemId]) {
      problemMap[sub.problemId] = {
        solved: false,
        failedAttempts: 0,
        totalAttempts: 0,
        timeMinutes: 0,
        points: 0,
      };
    }

    const state = problemMap[sub.problemId];

    // Submissions after already accepted are ignored
    if (state.solved) {
      continue;
    }

    state.totalAttempts += 1;

    if (sub.status === "ACCEPTED") {
      state.solved = true;
      const subMs = new Date(sub.submittedAt).getTime();
      state.timeMinutes = Math.max(0, Math.floor((subMs - startMs) / 60000));
      state.points = sub.points ?? 100;
    } else {
      state.failedAttempts += 1;
    }
  }

  let totalScore = 0;
  let totalPenaltyMinutes = 0;
  const problemStats: ContestScoreResult["problemStats"] = {};

  for (const [probId, state] of Object.entries(problemMap)) {
    if (state.solved) {
      totalScore += state.points;
      const penalty = state.timeMinutes + state.failedAttempts * 10;
      totalPenaltyMinutes += penalty;
      problemStats[probId] = {
        solved: true,
        attempts: state.totalAttempts,
        timeMinutes: state.timeMinutes,
      };
    } else {
      problemStats[probId] = {
        solved: false,
        attempts: state.totalAttempts,
        timeMinutes: 0,
      };
    }
  }

  return {
    score: totalScore,
    penaltyMinutes: totalPenaltyMinutes,
    problemStats,
  };
}

/**
 * Standings Sorting:
 * - Primary sort: total score DESC
 * - Secondary sort: penalty minutes ASC
 * - Assigns standard competition ranking (1-2-2-4)
 */
export function calculateStandings(
  participations: ParticipantScore[]
): RankedStanding[] {
  if (!participations || participations.length === 0) {
    return [];
  }

  const sorted = [...participations].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score; // Score DESC
    }
    if (a.penaltyMinutes !== b.penaltyMinutes) {
      return a.penaltyMinutes - b.penaltyMinutes; // Penalty ASC
    }
    return a.username.localeCompare(b.username);
  });

  const ranked: RankedStanding[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      ranked.push({ ...sorted[i], rank: 1 });
    } else {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (
        curr.score === prev.score &&
        curr.penaltyMinutes === prev.penaltyMinutes
      ) {
        ranked.push({ ...curr, rank: ranked[i - 1].rank });
      } else {
        ranked.push({ ...curr, rank: i + 1 });
      }
    }
  }

  return ranked;
}

/**
 * Multi-player Elo/Glicko Rating Deltas Calculation:
 * - Pairwise expected score vs actual placement
 * - High ranked gains rating, lower ranked loses rating
 * - Zero-sum exchange (sum of deltas ≈ 0)
 * - Clamped within [-100, 100] bounds
 */
export function calculateRatingDeltas(
  rankedParticipants: RankedParticipant[]
): Map<string, number> {
  const deltas = new Map<string, number>();
  const n = rankedParticipants.length;

  if (n === 0) {
    return deltas;
  }

  if (n === 1) {
    deltas.set(rankedParticipants[0].userId, 0);
    return deltas;
  }

  const K = 32;

  for (let i = 0; i < n; i++) {
    const playerA = rankedParticipants[i];
    let actualSum = 0;
    let expectedSum = 0;

    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const playerB = rankedParticipants[j];

      // Expected outcome of A against B
      const expectedA =
        1 / (1 + Math.pow(10, (playerB.currentRating - playerA.currentRating) / 400));
      expectedSum += expectedA;

      // Actual outcome
      if (playerA.rank < playerB.rank) {
        actualSum += 1.0; // A defeated B
      } else if (playerA.rank === playerB.rank) {
        actualSum += 0.5; // Tie
      } else {
        actualSum += 0.0; // B defeated A
      }
    }

    const rawDelta = (K / (n - 1)) * (actualSum - expectedSum);
    const rounded = Math.round(rawDelta);
    // Delta bounds: [-100, 100]
    const clamped = Math.max(-100, Math.min(100, rounded));
    deltas.set(playerA.userId, clamped);
  }

  return deltas;
}

/**
 * User Achievement Badge Evaluation:
 * - "First Blood": first solve (totalSolved >= 1)
 * - "Streak 7": 7-day streak (streakCount >= 7)
 * - "Century Club": 100 solved (totalSolved >= 100)
 * - "Contest Champion": rank 1 in a contest
 * - Additional badges for rating, streak, podium
 */
export function evaluateBadges(user: {
  streakCount: number;
  totalSolved: number;
  rating: number;
  contestRanks: number[];
}): Badge[] {
  const { streakCount, totalSolved, rating, contestRanks } = user;

  const hasFirstSolve = totalSolved >= 1;
  const hasStreak7 = streakCount >= 7;
  const hasStreak30 = streakCount >= 30;
  const hasCentury = totalSolved >= 100;
  const hasChampion = contestRanks.some((r) => r === 1);
  const hasPodium = contestRanks.some((r) => r >= 1 && r <= 3);
  const hasKnight = rating >= 1600;
  const hasGrandmaster = rating >= 2000;

  return [
    {
      id: "badge-first-blood",
      slug: "first-blood",
      title: "First Blood",
      description: "Solve your very first algorithmic problem on Dev Arena.",
      icon: "Zap",
      category: "achievement",
      unlocked: hasFirstSolve,
      progress: {
        current: Math.min(totalSolved, 1),
        target: 1,
      },
    },
    {
      id: "badge-streak-7",
      slug: "streak-7",
      title: "Streak 7",
      description: "Maintain a consecutive 7-day problem solving streak.",
      icon: "Flame",
      category: "streak",
      unlocked: hasStreak7,
      progress: {
        current: Math.min(streakCount, 7),
        target: 7,
      },
    },
    {
      id: "badge-century-club",
      slug: "century-club",
      title: "Century Club",
      description: "Solve 100 unique algorithmic challenges.",
      icon: "Target",
      category: "achievement",
      unlocked: hasCentury,
      progress: {
        current: Math.min(totalSolved, 100),
        target: 100,
      },
    },
    {
      id: "badge-contest-champion",
      slug: "contest-champion",
      title: "Contest Champion",
      description: "Place 1st on the leaderboard in an official timed contest.",
      icon: "Crown",
      category: "contest",
      unlocked: hasChampion,
      progress: {
        current: contestRanks.filter((r) => r === 1).length,
        target: 1,
      },
    },
    {
      id: "badge-podium-finisher",
      slug: "podium-finisher",
      title: "Podium Finisher",
      description: "Secure a Top 3 placement in an official timed contest.",
      icon: "Trophy",
      category: "contest",
      unlocked: hasPodium,
      progress: {
        current: contestRanks.filter((r) => r >= 1 && r <= 3).length,
        target: 1,
      },
    },
    {
      id: "badge-knight",
      slug: "knight",
      title: "Knight",
      description: "Attain a competitive arena rating of 1600 or higher.",
      icon: "Shield",
      category: "rating",
      unlocked: hasKnight,
      progress: {
        current: Math.min(rating, 1600),
        target: 1600,
      },
    },
    {
      id: "badge-grandmaster",
      slug: "grandmaster",
      title: "Grandmaster",
      description: "Attain an elite rating of 2000 or higher.",
      icon: "Star",
      category: "rating",
      unlocked: hasGrandmaster,
      progress: {
        current: Math.min(rating, 2000),
        target: 2000,
      },
    },
    {
      id: "badge-streak-30",
      slug: "streak-30",
      title: "Streak 30",
      description: "Unstoppable dedication: 30 consecutive active days.",
      icon: "Flame",
      category: "streak",
      unlocked: hasStreak30,
      progress: {
        current: Math.min(streakCount, 30),
        target: 30,
      },
    },
  ];
}

/**
 * Rating Tier Resolver
 */
export function getRatingTier(rating: number): {
  tier: string;
  color: string;
  badgeBg: string;
} {
  if (rating >= 2000) {
    return {
      tier: "Grandmaster",
      color: "text-red-400",
      badgeBg: "bg-red-500/10 text-red-400 border-red-500/30",
    };
  }
  if (rating >= 1800) {
    return {
      tier: "Master",
      color: "text-amber-400",
      badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    };
  }
  if (rating >= 1600) {
    return {
      tier: "Knight",
      color: "text-purple-400",
      badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    };
  }
  if (rating >= 1400) {
    return {
      tier: "Specialist",
      color: "text-blue-400",
      badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    };
  }
  if (rating >= 1200) {
    return {
      tier: "Pupil",
      color: "text-emerald-400",
      badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    };
  }
  return {
    tier: "Novice",
    color: "text-slate-400",
    badgeBg: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  };
}

/**
 * Initial Seeded Contests Dataset
 */
const NOW = Date.now();

export const SEEDED_CONTESTS: SeededContest[] = [
  {
    id: "contest-weekly-arena-1",
    slug: "weekly-arena-1",
    title: "Weekly Arena 1: Core Algorithms",
    description:
      "Speed and precision test covering array hash lookups, parenthesis balancing, and container bounds.",
    startTime: new Date(NOW - 35 * 60 * 1000).toISOString(), // started 35m ago
    endTime: new Date(NOW + 55 * 60 * 1000).toISOString(), // ends in 55m
    status: "ONGOING",
    durationMinutes: 90,
    problemCount: 3,
    participantCount: 142,
    problemWeights: {
      "two-sum": 100,
      "valid-parentheses": 250,
      "container-with-most-water": 500,
    },
    problems: [
      {
        id: "p-two-sum",
        slug: "two-sum",
        title: "Two Sum",
        difficulty: "EASY",
        points: 100,
      },
      {
        id: "p-valid-parentheses",
        slug: "valid-parentheses",
        title: "Valid Parentheses",
        difficulty: "EASY",
        points: 250,
      },
      {
        id: "p-container-with-most-water",
        slug: "container-with-most-water",
        title: "Container With Most Water",
        difficulty: "MEDIUM",
        points: 500,
      },
    ],
    leaderboard: [
      {
        rank: 1,
        userId: "user-alexchen",
        username: "alexchen",
        avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=alexchen",
        score: 850,
        penaltyMinutes: 48,
        ratingDelta: 34,
        problemStats: {
          "two-sum": { solved: true, attempts: 1, timeMinutes: 6 },
          "valid-parentheses": { solved: true, attempts: 1, timeMinutes: 14 },
          "container-with-most-water": { solved: true, attempts: 2, timeMinutes: 28 },
        },
      },
      {
        rank: 2,
        userId: "user-sjenkins",
        username: "sjenkins",
        avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=sjenkins",
        score: 850,
        penaltyMinutes: 62,
        ratingDelta: 28,
        problemStats: {
          "two-sum": { solved: true, attempts: 1, timeMinutes: 8 },
          "valid-parentheses": { solved: true, attempts: 2, timeMinutes: 22 },
          "container-with-most-water": { solved: true, attempts: 1, timeMinutes: 32 },
        },
      },
      {
        rank: 3,
        userId: "user-kenjis",
        username: "kenji_s",
        avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=kenjis",
        score: 350,
        penaltyMinutes: 25,
        ratingDelta: 12,
        problemStats: {
          "two-sum": { solved: true, attempts: 1, timeMinutes: 7 },
          "valid-parentheses": { solved: true, attempts: 1, timeMinutes: 18 },
          "container-with-most-water": { solved: false, attempts: 3, timeMinutes: 0 },
        },
      },
      {
        rank: 4,
        userId: "user-mgarcia",
        username: "mgarcia",
        avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=mgarcia",
        score: 350,
        penaltyMinutes: 38,
        ratingDelta: 6,
        problemStats: {
          "two-sum": { solved: true, attempts: 1, timeMinutes: 11 },
          "valid-parentheses": { solved: true, attempts: 2, timeMinutes: 27 },
        },
      },
      {
        rank: 5,
        userId: "user-coder99",
        username: "coder_99",
        avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=coder99",
        score: 100,
        penaltyMinutes: 14,
        ratingDelta: -10,
        problemStats: {
          "two-sum": { solved: true, attempts: 1, timeMinutes: 14 },
          "valid-parentheses": { solved: false, attempts: 1, timeMinutes: 0 },
        },
      },
    ],
  },
  {
    id: "contest-biweekly-arena-1",
    slug: "biweekly-arena-1",
    title: "Bi-Weekly Arena 1: Dynamic Programming & Trees",
    description:
      "Intermediate and advanced challenges featuring recursive binary tree inversion, maximum subarray Kadane DP, and unbounded coin change.",
    startTime: new Date(NOW + 2 * 3600 * 1000 + 15 * 60 * 1000).toISOString(), // starts in 2h 15m
    endTime: new Date(NOW + 3 * 3600 * 1000 + 45 * 60 * 1000).toISOString(),
    status: "UPCOMING",
    durationMinutes: 90,
    problemCount: 3,
    participantCount: 89,
    problemWeights: {
      "invert-binary-tree": 100,
      "maximum-subarray": 300,
      "coin-change": 600,
    },
    problems: [
      {
        id: "p-invert-binary-tree",
        slug: "invert-binary-tree",
        title: "Invert Binary Tree",
        difficulty: "EASY",
        points: 100,
      },
      {
        id: "p-maximum-subarray",
        slug: "maximum-subarray",
        title: "Maximum Subarray",
        difficulty: "MEDIUM",
        points: 300,
      },
      {
        id: "p-coin-change",
        slug: "coin-change",
        title: "Coin Change",
        difficulty: "MEDIUM",
        points: 600,
      },
    ],
    leaderboard: [],
  },
  {
    id: "contest-beginner-cup",
    slug: "beginner-cup",
    title: "Beginner Cup: Strings & Linked Lists",
    description:
      "Introductory contest focused on foundational pointer traversal, array indices, and string symmetry.",
    startTime: new Date(NOW - 48 * 3600 * 1000).toISOString(),
    endTime: new Date(NOW - 48 * 3600 * 1000 + 90 * 60 * 1000).toISOString(),
    status: "FINISHED",
    durationMinutes: 90,
    problemCount: 3,
    participantCount: 312,
    problemWeights: {
      "two-sum": 100,
      "valid-palindrome": 200,
      "reverse-linked-list": 300,
    },
    problems: [
      {
        id: "p-two-sum",
        slug: "two-sum",
        title: "Two Sum",
        difficulty: "EASY",
        points: 100,
      },
      {
        id: "p-valid-palindrome",
        slug: "valid-palindrome",
        title: "Valid Palindrome",
        difficulty: "EASY",
        points: 200,
      },
      {
        id: "p-reverse-linked-list",
        slug: "reverse-linked-list",
        title: "Reverse Linked List",
        difficulty: "EASY",
        points: 300,
      },
    ],
    leaderboard: [
      {
        rank: 1,
        userId: "user-champion",
        username: "champion_dev",
        avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=champion",
        score: 600,
        penaltyMinutes: 32,
        ratingDelta: 42,
        problemStats: {
          "two-sum": { solved: true, attempts: 1, timeMinutes: 5 },
          "valid-palindrome": { solved: true, attempts: 1, timeMinutes: 11 },
          "reverse-linked-list": { solved: true, attempts: 1, timeMinutes: 16 },
        },
      },
      {
        rank: 2,
        userId: "user-coder99",
        username: "coder_99",
        avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=coder99",
        score: 600,
        penaltyMinutes: 45,
        ratingDelta: 31,
        problemStats: {
          "two-sum": { solved: true, attempts: 1, timeMinutes: 7 },
          "valid-palindrome": { solved: true, attempts: 1, timeMinutes: 14 },
          "reverse-linked-list": { solved: true, attempts: 2, timeMinutes: 24 },
        },
      },
      {
        rank: 3,
        userId: "user-novice",
        username: "algo_novice",
        avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=novice",
        score: 300,
        penaltyMinutes: 28,
        ratingDelta: 10,
        problemStats: {
          "two-sum": { solved: true, attempts: 1, timeMinutes: 8 },
          "valid-palindrome": { solved: true, attempts: 1, timeMinutes: 20 },
        },
      },
    ],
  },
];
