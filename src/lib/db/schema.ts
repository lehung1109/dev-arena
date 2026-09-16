import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// 1. Users Table
// ---------------------------------------------------------------------------
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  avatarUrl: text("avatar_url"),
  rating: integer("rating").notNull().default(1200),
  streakCount: integer("streak_count").notNull().default(0),
  lastActiveDate: date("last_active_date"),
  totalSolved: integer("total_solved").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// 2. Problems Table
// ---------------------------------------------------------------------------
export const problems = pgTable("problems", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  difficulty: varchar("difficulty", { length: 20 }).$type<"EASY" | "MEDIUM" | "HARD">().notNull(),
  topicTags: jsonb("topic_tags").$type<string[]>().notNull(),
  starterCode: text("starter_code").notNull(),
  functionName: varchar("function_name", { length: 100 }).notNull(),
  hints: jsonb("hints").$type<string[]>().notNull().default([]),
  authorId: uuid("author_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// 3. Test Cases Table
// ---------------------------------------------------------------------------
export const testCases = pgTable("test_cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  problemId: uuid("problem_id")
    .notNull()
    .references(() => problems.id, { onDelete: "cascade" }),
  input: jsonb("input").notNull(),
  expectedOutput: jsonb("expected_output").notNull(),
  isPublic: boolean("is_public").notNull().default(false),
  orderIndex: integer("order_index").notNull().default(0),
  explanation: text("explanation"),
});

// ---------------------------------------------------------------------------
// 4. Benchmark Cases Table (Multi-N Empirical Big-O Estimation)
// ---------------------------------------------------------------------------
export const benchmarkCases = pgTable("benchmark_cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  problemId: uuid("problem_id")
    .notNull()
    .references(() => problems.id, { onDelete: "cascade" }),
  inputSize: integer("input_size").notNull(),
  inputPayload: jsonb("input_payload").notNull(),
});

// ---------------------------------------------------------------------------
// 5. Submissions Table
// ---------------------------------------------------------------------------
export const submissions = pgTable("submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  problemId: uuid("problem_id")
    .notNull()
    .references(() => problems.id),
  code: text("code").notNull(),
  status: varchar("status", { length: 30 }).notNull(),
  runtimeMs: numeric("runtime_ms", { precision: 8, scale: 2 }),
  memoryBytes: numeric("memory_bytes", { precision: 12, scale: 2 }),
  passedTestCases: integer("passed_test_cases").notNull().default(0),
  totalTestCases: integer("total_test_cases").notNull().default(0),
  testResultsDetail: jsonb("test_results_detail"),
  astMetrics: jsonb("ast_metrics"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// 6. Skill Nodes Table (DAG Curriculum)
// ---------------------------------------------------------------------------
export const skillNodes = pgTable("skill_nodes", {
  id: varchar("id", { length: 50 }).primaryKey(),
  topicName: varchar("topic_name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  prerequisites: jsonb("prerequisites").$type<string[]>().notNull().default([]),
  requiredSolves: integer("required_solves").notNull().default(3),
  orderIndex: integer("order_index").notNull().default(0),
});

// ---------------------------------------------------------------------------
// 7. User Skill Progress Table
// ---------------------------------------------------------------------------
export const userSkillProgress = pgTable(
  "user_skill_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    skillNodeId: varchar("skill_node_id", { length: 50 })
      .notNull()
      .references(() => skillNodes.id),
    solvedCount: integer("solved_count").notNull().default(0),
    masteryScore: numeric("mastery_score", { precision: 5, scale: 2 }).notNull().default("0.00"),
    isUnlocked: boolean("is_unlocked").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_skill_progress_user_skill_idx").on(table.userId, table.skillNodeId),
  ]
);

// ---------------------------------------------------------------------------
// 8. Contests Table
// ---------------------------------------------------------------------------
export const contests = pgTable("contests", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 20 })
    .$type<"UPCOMING" | "ONGOING" | "FINISHED">()
    .notNull(),
  problemWeights: jsonb("problem_weights").notNull(),
});

// ---------------------------------------------------------------------------
// 9. Contest Participations Table
// ---------------------------------------------------------------------------
export const contestParticipations = pgTable(
  "contest_participations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    score: integer("score").notNull().default(0),
    penaltyMinutes: integer("penalty_minutes").notNull().default(0),
    finalRank: integer("final_rank"),
    ratingDelta: integer("rating_delta"),
  },
  (table) => [
    uniqueIndex("contest_participations_contest_user_idx").on(table.contestId, table.userId),
  ]
);

// ---------------------------------------------------------------------------
// 10. Achievement Badges Table
// ---------------------------------------------------------------------------
export const achievementBadges = pgTable("achievement_badges", {
  id: varchar("id", { length: 50 }).primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url"),
  criteriaType: varchar("criteria_type", { length: 50 }).notNull(),
  criteriaValue: varchar("criteria_value", { length: 100 }).notNull(),
});

// ---------------------------------------------------------------------------
// 11. Discussion Posts Table
// ---------------------------------------------------------------------------
export const discussionPosts = pgTable("discussion_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  problemId: uuid("problem_id")
    .notNull()
    .references(() => problems.id),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  approachTags: jsonb("approach_tags").$type<string[]>().default([]),
  upvotes: integer("upvotes").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Drizzle Relations
// ---------------------------------------------------------------------------
export const usersRelations = relations(users, ({ many }) => ({
  submissions: many(submissions),
  skillProgress: many(userSkillProgress),
  contestParticipations: many(contestParticipations),
  discussionPosts: many(discussionPosts),
  problemsAuthored: many(problems),
}));

export const problemsRelations = relations(problems, ({ one, many }) => ({
  author: one(users, {
    fields: [problems.authorId],
    references: [users.id],
  }),
  testCases: many(testCases),
  benchmarkCases: many(benchmarkCases),
  submissions: many(submissions),
  discussionPosts: many(discussionPosts),
}));

export const testCasesRelations = relations(testCases, ({ one }) => ({
  problem: one(problems, {
    fields: [testCases.problemId],
    references: [problems.id],
  }),
}));

export const benchmarkCasesRelations = relations(benchmarkCases, ({ one }) => ({
  problem: one(problems, {
    fields: [benchmarkCases.problemId],
    references: [problems.id],
  }),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  user: one(users, {
    fields: [submissions.userId],
    references: [users.id],
  }),
  problem: one(problems, {
    fields: [submissions.problemId],
    references: [problems.id],
  }),
}));

export const skillNodesRelations = relations(skillNodes, ({ many }) => ({
  userProgress: many(userSkillProgress),
}));

export const userSkillProgressRelations = relations(userSkillProgress, ({ one }) => ({
  user: one(users, {
    fields: [userSkillProgress.userId],
    references: [users.id],
  }),
  skillNode: one(skillNodes, {
    fields: [userSkillProgress.skillNodeId],
    references: [skillNodes.id],
  }),
}));

export const contestsRelations = relations(contests, ({ many }) => ({
  participations: many(contestParticipations),
}));

export const contestParticipationsRelations = relations(contestParticipations, ({ one }) => ({
  contest: one(contests, {
    fields: [contestParticipations.contestId],
    references: [contests.id],
  }),
  user: one(users, {
    fields: [contestParticipations.userId],
    references: [users.id],
  }),
}));

export const discussionPostsRelations = relations(discussionPosts, ({ one }) => ({
  problem: one(problems, {
    fields: [discussionPosts.problemId],
    references: [problems.id],
  }),
  author: one(users, {
    fields: [discussionPosts.authorId],
    references: [users.id],
  }),
}));
