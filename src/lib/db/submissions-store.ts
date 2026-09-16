/**
 * Submissions In-Memory Store & Resolver
 * Provides persistence for in-browser testing, mock environments, and fast querying.
 * Dev Arena - 001-in-browser-code-arena
 */

import { SEED_PROBLEMS } from "./seeds/seed-problems";

export type SubmissionStatus =
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "TIME_LIMIT_EXCEEDED"
  | "RUNTIME_ERROR"
  | "SYNTAX_ERROR";

export const VALID_STATUSES: Set<string> = new Set([
  "ACCEPTED",
  "WRONG_ANSWER",
  "TIME_LIMIT_EXCEEDED",
  "RUNTIME_ERROR",
  "SYNTAX_ERROR",
]);

export interface StoredSubmission {
  id: string;
  problemId: string;
  problemTitle: string;
  code: string;
  status: SubmissionStatus;
  runtimeMs?: number;
  memoryBytes?: number;
  passedTestCases: number;
  totalTestCases: number;
  testResultsDetail?: any[];
  astMetrics?: any;
  submittedAt: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __dev_arena_submissions: StoredSubmission[] | undefined;
  // eslint-disable-next-line no-var
  var __dev_arena_solved_problems: Set<string> | undefined;
}

function getStore(): StoredSubmission[] {
  if (!globalThis.__dev_arena_submissions) {
    globalThis.__dev_arena_submissions = [];
  }
  return globalThis.__dev_arena_submissions;
}

export function getSolvedSet(): Set<string> {
  if (!globalThis.__dev_arena_solved_problems) {
    globalThis.__dev_arena_solved_problems = new Set<string>();
  }
  return globalThis.__dev_arena_solved_problems;
}

export function getSolvedProblemIds(): Set<string> {
  return new Set(getSolvedSet());
}

export function resolveProblemTitle(problemId: string): string {
  const seed = SEED_PROBLEMS.find(
    (p) =>
      p.slug === problemId ||
      `seed-${p.slug}` === problemId ||
      problemId.includes(p.slug)
  );
  if (seed) return seed.title;
  return problemId;
}

export const MAX_IN_MEMORY_SUBMISSIONS = 500;

export function saveInMemorySubmission(sub: StoredSubmission): void {
  const store = getStore();
  // Prepend to maintain newest first
  store.unshift(sub);
  if (store.length > MAX_IN_MEMORY_SUBMISSIONS) {
    store.pop();
  }

  if (sub.status === "ACCEPTED") {
    getSolvedSet().add(sub.problemId);
  }
}

export function listInMemorySubmissions(filter?: {
  problemId?: string;
  status?: string;
  page?: number;
  limit?: number;
}): { items: StoredSubmission[]; total: number } {
  let list = [...getStore()];

  if (filter?.problemId) {
    list = list.filter(
      (s) =>
        s.problemId === filter.problemId ||
        s.problemId === `seed-${filter.problemId}` ||
        `seed-${s.problemId}` === filter.problemId
    );
  }

  if (filter?.status) {
    list = list.filter((s) => s.status === filter.status);
  }

  // Sort descending by submittedAt
  list.sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  const total = list.length;
  const page = Math.max(1, filter?.page ?? 1);
  const limit = Math.max(1, filter?.limit ?? 20);
  const start = (page - 1) * limit;
  const paginated = list.slice(start, start + limit);

  return {
    items: paginated,
    total,
  };
}

export function findInMemorySubmissionById(
  id: string
): StoredSubmission | undefined {
  return getStore().find((s) => s.id === id);
}

export function isProblemSolved(problemId: string): boolean {
  return getSolvedSet().has(problemId);
}
