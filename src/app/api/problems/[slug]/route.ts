import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { problems, testCases } from "@/lib/db/schema";
import { SEED_PROBLEMS } from "@/lib/db/seeds/seed-problems";
import { eq, asc } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ slug: string }> | { slug: string };
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const params = await context.params;
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { error: "Problem slug is required" },
        { status: 400 }
      );
    }

    // Attempt database query first if connection is available
    let dbProblem = null;
    try {
      if (
        process.env.DATABASE_URL &&
        !process.env.DATABASE_URL.includes("mock_pass")
      ) {
        dbProblem = await db.query.problems.findFirst({
          where: eq(problems.slug, slug),
          with: {
            testCases: {
              where: eq(testCases.isPublic, true),
              orderBy: [asc(testCases.orderIndex)],
            },
          },
        });
      }
    } catch {
      // Fallback to in-memory seed dataset on connection failure or mock configuration
      dbProblem = null;
    }

    if (dbProblem) {
      return NextResponse.json({
        id: dbProblem.id,
        slug: dbProblem.slug,
        title: dbProblem.title,
        description: dbProblem.description,
        difficulty: dbProblem.difficulty,
        topicTags: dbProblem.topicTags,
        starterCode: dbProblem.starterCode,
        functionName: dbProblem.functionName,
        hints: dbProblem.hints || [],
        publicTestCases: (dbProblem.testCases || []).map((tc) => ({
          id: tc.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isPublic: true,
          orderIndex: tc.orderIndex,
          explanation: tc.explanation,
        })),
      });
    }

    // Fallback: look up in seed problems
    const seedProblem = SEED_PROBLEMS.find((p) => p.slug === slug);
    if (!seedProblem) {
      return NextResponse.json(
        { error: `Problem with slug '${slug}' not found` },
        { status: 404 }
      );
    }

    const publicCases = (seedProblem.testCases || [])
      .filter((tc) => tc.isPublic)
      .map((tc, idx) => ({
        id: (tc as any).id || `tc-${seedProblem.slug}-${tc.orderIndex ?? idx}`,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isPublic: true,
        orderIndex: tc.orderIndex ?? idx,
        explanation: tc.explanation,
      }));

    return NextResponse.json({
      id: `seed-${seedProblem.slug}`,
      slug: seedProblem.slug,
      title: seedProblem.title,
      description: seedProblem.description,
      difficulty: seedProblem.difficulty,
      topicTags: seedProblem.topicTags,
      starterCode: seedProblem.starterCode,
      functionName: seedProblem.functionName,
      hints: seedProblem.hints || [],
      publicTestCases: publicCases,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
