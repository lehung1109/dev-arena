import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { problems, testCases as testCasesTable } from "@/lib/db/schema";
import { SEED_PROBLEMS } from "@/lib/db/seeds/seed-problems";
import { findCatalogProblem } from "@/lib/curriculum/problems-catalog";
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

    const url = new URL(request.url);
    const scope = url.searchParams.get("scope") || "public";

    // Attempt database query first
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
              where:
                scope === "all"
                  ? undefined
                  : eq(testCasesTable.isPublic, true),
              orderBy: [asc(testCasesTable.orderIndex)],
            },
            benchmarkCases: true,
          },
        });
      }
    } catch {
      dbProblem = null;
    }

    if (dbProblem) {
      return NextResponse.json({
        testCases: (dbProblem.testCases || []).map((tc) => ({
          id: tc.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isPublic: tc.isPublic,
          orderIndex: tc.orderIndex,
          explanation: tc.explanation,
        })),
        benchmarkCases: (dbProblem.benchmarkCases || []).map((bc) => ({
          id: bc.id,
          inputSize: bc.inputSize,
          inputPayload: bc.inputPayload,
        })),
      });
    }

    // Fallback: look up in seed problems or extended catalog
    const seedProblem = SEED_PROBLEMS.find((p) => p.slug === slug) || findCatalogProblem(slug);
    if (!seedProblem) {
      return NextResponse.json(
        { error: `Problem with slug '${slug}' not found` },
        { status: 404 }
      );
    }

    const filteredCases =
      scope === "all"
        ? seedProblem.testCases || []
        : (seedProblem.testCases || []).filter((tc) => tc.isPublic);

    const mappedTestCases = filteredCases.map((tc, idx) => ({
      id: (tc as any).id || `tc-${seedProblem.slug}-${tc.orderIndex ?? idx}`,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isPublic: tc.isPublic,
      orderIndex: tc.orderIndex ?? idx,
      explanation: tc.explanation,
    }));

    const mappedBenchmarkCases = (seedProblem.benchmarkCases || []).map(
      (bc, idx) => ({
        id: (bc as any).id || `bc-${seedProblem.slug}-${idx}`,
        inputSize: bc.inputSize,
        inputPayload: bc.inputPayload,
      })
    );

    return NextResponse.json({
      testCases: mappedTestCases,
      benchmarkCases: mappedBenchmarkCases,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
