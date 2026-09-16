import { describe, it, expect } from "vitest";
import { db, schema } from "@/lib/db/client";
import { getTableColumns } from "drizzle-orm";

describe("Database Schema & Client Unit Tests (Phase 2)", () => {
  it("exports a valid Drizzle client singleton and schema", () => {
    expect(db).toBeDefined();
    expect(schema).toBeDefined();
  });

  it("exports all 11 required core database tables", () => {
    expect(schema.users).toBeDefined();
    expect(schema.problems).toBeDefined();
    expect(schema.testCases).toBeDefined();
    expect(schema.benchmarkCases).toBeDefined();
    expect(schema.submissions).toBeDefined();
    expect(schema.skillNodes).toBeDefined();
    expect(schema.userSkillProgress).toBeDefined();
    expect(schema.contests).toBeDefined();
    expect(schema.contestParticipations).toBeDefined();
    expect(schema.achievementBadges).toBeDefined();
    expect(schema.discussionPosts).toBeDefined();
  });

  describe("Users Table Schema", () => {
    it("has all required columns with correct types and defaults", () => {
      const cols = getTableColumns(schema.users);
      expect(cols.id).toBeDefined();
      expect(cols.username).toBeDefined();
      expect(cols.email).toBeDefined();
      expect(cols.avatarUrl).toBeDefined();
      expect(cols.rating).toBeDefined();
      expect(cols.streakCount).toBeDefined();
      expect(cols.lastActiveDate).toBeDefined();
      expect(cols.totalSolved).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();

      expect(cols.rating.default).toBe(1200);
      expect(cols.streakCount.default).toBe(0);
      expect(cols.totalSolved.default).toBe(0);
    });
  });

  describe("Problems Table Schema", () => {
    it("has all required columns with correct constraints", () => {
      const cols = getTableColumns(schema.problems);
      expect(cols.id).toBeDefined();
      expect(cols.slug).toBeDefined();
      expect(cols.title).toBeDefined();
      expect(cols.description).toBeDefined();
      expect(cols.difficulty).toBeDefined();
      expect(cols.topicTags).toBeDefined();
      expect(cols.starterCode).toBeDefined();
      expect(cols.functionName).toBeDefined();
      expect(cols.hints).toBeDefined();
      expect(cols.authorId).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });
  });

  describe("TestCases Table Schema", () => {
    it("has all required columns and foreign key to problems", () => {
      const cols = getTableColumns(schema.testCases);
      expect(cols.id).toBeDefined();
      expect(cols.problemId).toBeDefined();
      expect(cols.input).toBeDefined();
      expect(cols.expectedOutput).toBeDefined();
      expect(cols.isPublic).toBeDefined();
      expect(cols.orderIndex).toBeDefined();
      expect(cols.explanation).toBeDefined();

      expect(cols.isPublic.default).toBe(false);
      expect(cols.orderIndex.default).toBe(0);
    });
  });

  describe("BenchmarkCases Table Schema", () => {
    it("has all required columns for Big-O benchmarking", () => {
      const cols = getTableColumns(schema.benchmarkCases);
      expect(cols.id).toBeDefined();
      expect(cols.problemId).toBeDefined();
      expect(cols.inputSize).toBeDefined();
      expect(cols.inputPayload).toBeDefined();
    });
  });

  describe("Submissions Table Schema", () => {
    it("has execution metrics, AST details, and foreign keys", () => {
      const cols = getTableColumns(schema.submissions);
      expect(cols.id).toBeDefined();
      expect(cols.userId).toBeDefined();
      expect(cols.problemId).toBeDefined();
      expect(cols.code).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.runtimeMs).toBeDefined();
      expect(cols.memoryBytes).toBeDefined();
      expect(cols.passedTestCases).toBeDefined();
      expect(cols.totalTestCases).toBeDefined();
      expect(cols.testResultsDetail).toBeDefined();
      expect(cols.astMetrics).toBeDefined();
      expect(cols.submittedAt).toBeDefined();

      expect(cols.passedTestCases.default).toBe(0);
      expect(cols.totalTestCases.default).toBe(0);
    });
  });

  describe("SkillNodes and UserSkillProgress Table Schemas", () => {
    it("has skillNodes columns for DAG curriculum representation", () => {
      const cols = getTableColumns(schema.skillNodes);
      expect(cols.id).toBeDefined();
      expect(cols.topicName).toBeDefined();
      expect(cols.description).toBeDefined();
      expect(cols.icon).toBeDefined();
      expect(cols.prerequisites).toBeDefined();
      expect(cols.requiredSolves).toBeDefined();
      expect(cols.orderIndex).toBeDefined();

      expect(cols.requiredSolves.default).toBe(3);
      expect(cols.orderIndex.default).toBe(0);
    });

    it("has userSkillProgress columns tracking topic mastery", () => {
      const cols = getTableColumns(schema.userSkillProgress);
      expect(cols.id).toBeDefined();
      expect(cols.userId).toBeDefined();
      expect(cols.skillNodeId).toBeDefined();
      expect(cols.solvedCount).toBeDefined();
      expect(cols.masteryScore).toBeDefined();
      expect(cols.isUnlocked).toBeDefined();
      expect(cols.updatedAt).toBeDefined();

      expect(cols.solvedCount.default).toBe(0);
      expect(cols.isUnlocked.default).toBe(false);
    });
  });

  describe("Contests and ContestParticipations Table Schemas", () => {
    it("has contests columns and status", () => {
      const cols = getTableColumns(schema.contests);
      expect(cols.id).toBeDefined();
      expect(cols.slug).toBeDefined();
      expect(cols.title).toBeDefined();
      expect(cols.description).toBeDefined();
      expect(cols.startTime).toBeDefined();
      expect(cols.endTime).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.problemWeights).toBeDefined();
    });

    it("has contestParticipations columns and leaderboard metrics", () => {
      const cols = getTableColumns(schema.contestParticipations);
      expect(cols.id).toBeDefined();
      expect(cols.contestId).toBeDefined();
      expect(cols.userId).toBeDefined();
      expect(cols.score).toBeDefined();
      expect(cols.penaltyMinutes).toBeDefined();
      expect(cols.finalRank).toBeDefined();
      expect(cols.ratingDelta).toBeDefined();

      expect(cols.score.default).toBe(0);
      expect(cols.penaltyMinutes.default).toBe(0);
    });
  });

  describe("AchievementBadges Table Schema", () => {
    it("has all achievement badge definition columns", () => {
      const cols = getTableColumns(schema.achievementBadges);
      expect(cols.id).toBeDefined();
      expect(cols.slug).toBeDefined();
      expect(cols.title).toBeDefined();
      expect(cols.description).toBeDefined();
      expect(cols.iconUrl).toBeDefined();
      expect(cols.criteriaType).toBeDefined();
      expect(cols.criteriaValue).toBeDefined();
    });
  });

  describe("DiscussionPosts Table Schema", () => {
    it("has discussion post columns and upvotes", () => {
      const cols = getTableColumns(schema.discussionPosts);
      expect(cols.id).toBeDefined();
      expect(cols.problemId).toBeDefined();
      expect(cols.authorId).toBeDefined();
      expect(cols.title).toBeDefined();
      expect(cols.content).toBeDefined();
      expect(cols.approachTags).toBeDefined();
      expect(cols.upvotes).toBeDefined();
      expect(cols.createdAt).toBeDefined();

      expect(cols.upvotes.default).toBe(0);
    });
  });

  describe("Drizzle Schema Relations", () => {
    it("exports relational definitions for entity associations", () => {
      expect(schema.usersRelations).toBeDefined();
      expect(schema.problemsRelations).toBeDefined();
      expect(schema.testCasesRelations).toBeDefined();
      expect(schema.benchmarkCasesRelations).toBeDefined();
      expect(schema.submissionsRelations).toBeDefined();
      expect(schema.skillNodesRelations).toBeDefined();
      expect(schema.userSkillProgressRelations).toBeDefined();
      expect(schema.contestsRelations).toBeDefined();
      expect(schema.contestParticipationsRelations).toBeDefined();
      expect(schema.discussionPostsRelations).toBeDefined();
    });
  });

  describe("Seed Dataset Verification", () => {
    it("provides foundational problems with test cases and benchmarks", async () => {
      const { SEED_PROBLEMS, SEED_SKILL_NODES, seed } = await import(
        "@/lib/db/seeds/seed-problems"
      );

      expect(SEED_PROBLEMS.length).toBeGreaterThanOrEqual(4);
      const slugs = SEED_PROBLEMS.map((p) => p.slug);
      expect(slugs).toContain("two-sum");
      expect(slugs).toContain("valid-parentheses");
      expect(slugs).toContain("reverse-linked-list");
      expect(slugs).toContain("maximum-subarray");

      for (const p of SEED_PROBLEMS) {
        expect(p.title).toBeTruthy();
        expect(p.functionName).toBeTruthy();
        expect(p.starterCode).toBeTruthy();
        expect(p.testCases.length).toBeGreaterThanOrEqual(3);
        expect(p.benchmarkCases.length).toBeGreaterThanOrEqual(3);
      }

      expect(SEED_SKILL_NODES.length).toBe(6);
      const skillIds = SEED_SKILL_NODES.map((s) => s.id);
      expect(skillIds).toEqual([
        "arrays_hashing",
        "two_pointers",
        "sliding_window",
        "linked_list",
        "trees",
        "dp_1d",
      ]);

      const seedResult = await seed();
      expect(seedResult.success).toBe(true);
      expect(seedResult.seededProblems).toBe(4);
      expect(seedResult.seededSkillNodes).toBe(6);
    });
  });
});

