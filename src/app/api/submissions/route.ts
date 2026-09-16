import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { submissions as submissionsTable, users, problems } from "@/lib/db/schema";
import {
  saveInMemorySubmission,
  listInMemorySubmissions,
  resolveProblemTitle,
  VALID_STATUSES,
  type StoredSubmission,
  type SubmissionStatus,
} from "@/lib/db/submissions-store";
import { eq, desc } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const {
      problemId,
      code,
      status,
      runtimeMs,
      memoryBytes,
      passedTestCases,
      totalTestCases,
      testResultsDetail,
      astMetrics,
    } = body;

    // Validate required fields
    if (
      !problemId ||
      typeof problemId !== "string" ||
      typeof code !== "string" ||
      code.trim().length === 0 ||
      status === undefined ||
      passedTestCases === undefined ||
      totalTestCases === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: problemId, code, status, passedTestCases, totalTestCases are required",
        },
        { status: 400 }
      );
    }

    if (code.length > 65536) {
      return NextResponse.json(
        { error: "Code submission exceeds maximum length limit of 64KB" },
        { status: 400 }
      );
    }

    const numPassed = Number(passedTestCases);
    const numTotal = Number(totalTestCases);
    if (
      isNaN(numPassed) ||
      isNaN(numTotal) ||
      numPassed < 0 ||
      numTotal < 0 ||
      numPassed > numTotal
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid test case counts: passedTestCases and totalTestCases must be non-negative numbers where passed <= total",
        },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json(
        {
          error: `Invalid status: '${status}'. Must be one of: ${Array.from(
            VALID_STATUSES
          ).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Redact hidden test case details to prevent confidentiality leakage in DB / detail endpoint
    const sanitizedDetails = Array.isArray(testResultsDetail)
      ? testResultsDetail.map((item: any) => {
          if (item && item.isPublic === false) {
            return {
              ...item,
              input: undefined,
              expectedOutput: undefined,
            };
          }
          return item;
        })
      : [];

    const problemTitle = resolveProblemTitle(problemId);
    const submissionId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `sub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const submittedAt = new Date().toISOString();

    const storedItem: StoredSubmission = {
      id: submissionId,
      problemId,
      problemTitle,
      code,
      status: status as SubmissionStatus,
      runtimeMs: runtimeMs !== undefined ? Number(runtimeMs) : undefined,
      memoryBytes: memoryBytes !== undefined ? Number(memoryBytes) : undefined,
      passedTestCases: numPassed,
      totalTestCases: numTotal,
      testResultsDetail: sanitizedDetails,
      astMetrics: astMetrics || null,
      submittedAt,
    };

    // Attempt Neon DB persistence if available
    let dbSuccess = false;
    try {
      if (
        process.env.DATABASE_URL &&
        !process.env.DATABASE_URL.includes("mock_pass")
      ) {
        // Resolve or create a default user for submissions
        let user = await db.query.users.findFirst();
        if (!user) {
          const [newUser] = await db
            .insert(users)
            .values({
              username: "dev_arena_coder",
              email: "coder@devarena.io",
            })
            .returning();
          user = newUser;
        }

        // Check if problemId matches a problem in DB by ID or slug
        const dbProb = await db.query.problems.findFirst({
          where: (p, { or, eq }) =>
            or(eq(p.id, problemId), eq(p.slug, problemId)),
        });

        if (user && dbProb) {
          await db.insert(submissionsTable).values({
            id: submissionId,
            userId: user.id,
            problemId: dbProb.id,
            code,
            status,
            runtimeMs: runtimeMs !== undefined ? String(runtimeMs) : null,
            memoryBytes: memoryBytes !== undefined ? String(memoryBytes) : null,
            passedTestCases: Number(passedTestCases),
            totalTestCases: Number(totalTestCases),
            testResultsDetail: storedItem.testResultsDetail,
            astMetrics: storedItem.astMetrics,
            submittedAt: new Date(submittedAt),
          });

          // Update user totalSolved count if accepted
          if (status === "ACCEPTED") {
            await db
              .update(users)
              .set({ totalSolved: (user.totalSolved || 0) + 1 })
              .where(eq(users.id, user.id));
          }

          dbSuccess = true;
        }
      }
    } catch {
      dbSuccess = false;
    }

    // Always maintain in-memory store for fast retrieval and test/mock environments
    saveInMemorySubmission(storedItem);

    return NextResponse.json(
      {
        id: storedItem.id,
        problemId: storedItem.problemId,
        problemTitle: storedItem.problemTitle,
        status: storedItem.status,
        runtimeMs: storedItem.runtimeMs,
        passedTestCases: storedItem.passedTestCases,
        totalTestCases: storedItem.totalTestCases,
        submittedAt: storedItem.submittedAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const problemId = url.searchParams.get("problemId") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    // Try DB first if connection is active
    let dbSubmissions: any[] | null = null;
    let totalCount = 0;

    try {
      if (
        process.env.DATABASE_URL &&
        !process.env.DATABASE_URL.includes("mock_pass")
      ) {
        const results = await db.query.submissions.findMany({
          orderBy: [desc(submissionsTable.submittedAt)],
          limit,
          offset: (page - 1) * limit,
          with: {
            problem: true,
          },
        });

        if (results && results.length > 0) {
          dbSubmissions = results.map((s) => ({
            id: s.id,
            problemId: s.problem?.slug || s.problemId,
            problemTitle: s.problem?.title || resolveProblemTitle(s.problemId),
            status: s.status,
            runtimeMs: s.runtimeMs ? parseFloat(s.runtimeMs) : undefined,
            passedTestCases: s.passedTestCases,
            totalTestCases: s.totalTestCases,
            submittedAt: s.submittedAt ? s.submittedAt.toISOString() : "",
          }));
          totalCount = dbSubmissions.length;
        }
      }
    } catch {
      dbSubmissions = null;
    }

    if (dbSubmissions && dbSubmissions.length > 0) {
      let filtered = dbSubmissions;
      if (problemId) {
        filtered = filtered.filter((s) => s.problemId === problemId);
      }
      if (status) {
        filtered = filtered.filter((s) => s.status === status);
      }
      return NextResponse.json({
        items: filtered,
        total: totalCount,
      });
    }

    // In-memory fallback
    const memoryResult = listInMemorySubmissions({
      problemId,
      status,
      page,
      limit,
    });

    return NextResponse.json({
      items: memoryResult.items.map((s) => ({
        id: s.id,
        problemId: s.problemId,
        problemTitle: s.problemTitle,
        status: s.status,
        runtimeMs: s.runtimeMs,
        passedTestCases: s.passedTestCases,
        totalTestCases: s.totalTestCases,
        submittedAt: s.submittedAt,
      })),
      total: memoryResult.total,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
