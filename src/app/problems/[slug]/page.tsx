import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db/client";
import { problems, testCases } from "@/lib/db/schema";
import { SEED_PROBLEMS } from "@/lib/db/seeds/seed-problems";
import { eq, asc } from "drizzle-orm";
import { ProblemWorkspace, type ProblemData } from "@/components/editor/ProblemWorkspace";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProblemBySlug(slug: string): Promise<ProblemData | null> {
  // 1. Try fetching from database if available
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("mock_pass")) {
      const dbProblem = await db.query.problems.findFirst({
        where: eq(problems.slug, slug),
        with: {
          testCases: {
            where: eq(testCases.isPublic, true),
            orderBy: [asc(testCases.orderIndex)],
          },
        },
      });

      if (dbProblem) {
        return {
          id: dbProblem.id,
          slug: dbProblem.slug,
          title: dbProblem.title,
          description: dbProblem.description,
          difficulty: dbProblem.difficulty as "EASY" | "MEDIUM" | "HARD",
          topicTags: dbProblem.topicTags,
          starterCode: dbProblem.starterCode,
          functionName: dbProblem.functionName,
          hints: dbProblem.hints || [],
          publicTestCases: (dbProblem.testCases || []).map((tc) => ({
            id: tc.id,
            input: tc.input as unknown[],
            expectedOutput: tc.expectedOutput,
            isPublic: true,
            orderIndex: tc.orderIndex,
            explanation: tc.explanation || undefined,
          })),
        };
      }
    }
  } catch {
    // Database unreachable or in mock mode; proceed to fallback
  }

  // 2. Fallback to seed problem definitions
  const seed = SEED_PROBLEMS.find((p) => p.slug === slug);
  if (!seed) return null;

  return {
    id: `seed-${seed.slug}`,
    slug: seed.slug,
    title: seed.title,
    description: seed.description,
    difficulty: seed.difficulty as "EASY" | "MEDIUM" | "HARD",
    topicTags: seed.topicTags,
    starterCode: seed.starterCode,
    functionName: seed.functionName,
    hints: seed.hints || [],
    publicTestCases: seed.testCases
      .filter((tc) => tc.isPublic)
      .map((tc, idx) => ({
        id: (tc as any).id || `tc-${seed.slug}-${tc.orderIndex ?? idx}`,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isPublic: true,
        orderIndex: tc.orderIndex ?? idx,
        explanation: tc.explanation,
      })),
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const problem = await getProblemBySlug(slug);

  if (!problem) {
    return {
      title: "Problem Not Found | Dev Arena",
    };
  }

  return {
    title: `${problem.title} | Dev Arena`,
    description: `Solve ${problem.title} (${problem.difficulty}) with zero-lag in-browser Web Worker execution and instant test feedback.`,
  };
}

export default async function ProblemPage({ params }: PageProps) {
  const { slug } = await params;
  const problem = await getProblemBySlug(slug);

  if (!problem) {
    notFound();
  }

  return <ProblemWorkspace problem={problem} />;
}
