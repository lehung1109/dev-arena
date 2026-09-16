import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { submissions as submissionsTable } from "@/lib/db/schema";
import {
  findInMemorySubmissionById,
  resolveProblemTitle,
} from "@/lib/db/submissions-store";
import { eq } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Submission ID is required" },
        { status: 400 }
      );
    }

    // Try DB query first
    let dbSubmission = null;
    try {
      if (
        process.env.DATABASE_URL &&
        !process.env.DATABASE_URL.includes("mock_pass")
      ) {
        dbSubmission = await db.query.submissions.findFirst({
          where: eq(submissionsTable.id, id),
          with: {
            problem: true,
          },
        });
      }
    } catch {
      dbSubmission = null;
    }

    if (dbSubmission) {
      return NextResponse.json({
        id: dbSubmission.id,
        problemId: dbSubmission.problem?.slug || dbSubmission.problemId,
        problemTitle:
          dbSubmission.problem?.title ||
          resolveProblemTitle(dbSubmission.problemId),
        status: dbSubmission.status,
        runtimeMs: dbSubmission.runtimeMs
          ? parseFloat(dbSubmission.runtimeMs)
          : undefined,
        passedTestCases: dbSubmission.passedTestCases,
        totalTestCases: dbSubmission.totalTestCases,
        submittedAt: dbSubmission.submittedAt
          ? dbSubmission.submittedAt.toISOString()
          : "",
        code: dbSubmission.code,
        testResultsDetail: dbSubmission.testResultsDetail || [],
        astMetrics: dbSubmission.astMetrics || null,
      });
    }

    // In-memory fallback
    const memorySubmission = findInMemorySubmissionById(id);
    if (!memorySubmission) {
      return NextResponse.json(
        { error: `Submission with ID '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: memorySubmission.id,
      problemId: memorySubmission.problemId,
      problemTitle: memorySubmission.problemTitle,
      status: memorySubmission.status,
      runtimeMs: memorySubmission.runtimeMs,
      passedTestCases: memorySubmission.passedTestCases,
      totalTestCases: memorySubmission.totalTestCases,
      submittedAt: memorySubmission.submittedAt,
      code: memorySubmission.code,
      testResultsDetail: memorySubmission.testResultsDetail || [],
      astMetrics: memorySubmission.astMetrics || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
