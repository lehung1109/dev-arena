import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type {
  achievementBadges,
  benchmarkCases,
  contestParticipations,
  contests,
  discussionPosts,
  problems,
  skillNodes,
  submissions,
  testCases,
  users,
  userSkillProgress,
} from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Model Select & Insert Types
// ---------------------------------------------------------------------------

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Problem = InferSelectModel<typeof problems>;
export type NewProblem = InferInsertModel<typeof problems>;

export type TestCase = InferSelectModel<typeof testCases>;
export type NewTestCase = InferInsertModel<typeof testCases>;

export type BenchmarkCase = InferSelectModel<typeof benchmarkCases>;
export type NewBenchmarkCase = InferInsertModel<typeof benchmarkCases>;

export type Submission = InferSelectModel<typeof submissions>;
export type NewSubmission = InferInsertModel<typeof submissions>;

export type SkillNode = InferSelectModel<typeof skillNodes>;
export type NewSkillNode = InferInsertModel<typeof skillNodes>;

export type UserSkillProgress = InferSelectModel<typeof userSkillProgress>;
export type NewUserSkillProgress = InferInsertModel<typeof userSkillProgress>;

export type Contest = InferSelectModel<typeof contests>;
export type NewContest = InferInsertModel<typeof contests>;

export type ContestParticipation = InferSelectModel<typeof contestParticipations>;
export type NewContestParticipation = InferInsertModel<typeof contestParticipations>;

export type AchievementBadge = InferSelectModel<typeof achievementBadges>;
export type NewAchievementBadge = InferInsertModel<typeof achievementBadges>;

export type DiscussionPost = InferSelectModel<typeof discussionPosts>;
export type NewDiscussionPost = InferInsertModel<typeof discussionPosts>;

// ---------------------------------------------------------------------------
// Domain Enums & Compound JSON Interfaces
// ---------------------------------------------------------------------------

export type ProblemDifficulty = "EASY" | "MEDIUM" | "HARD";

export type SubmissionStatus =
  | "PENDING"
  | "RUNNING"
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "TIME_LIMIT_EXCEEDED"
  | "RUNTIME_ERROR"
  | "SYNTAX_ERROR";

export type ContestStatus = "UPCOMING" | "ONGOING" | "FINISHED";

export interface AstMetrics {
  loopDepth: number;
  hasRecursion: boolean;
  estimatedBigO: string;
}

export interface TestCaseResultDetail {
  orderIndex: number;
  passed: boolean;
  input: unknown;
  expectedOutput: unknown;
  actualOutput?: unknown;
  executionTimeMs?: number;
  error?: string;
}
