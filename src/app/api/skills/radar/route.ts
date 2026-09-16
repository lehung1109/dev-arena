import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { submissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { calculateRadarMastery } from "@/lib/curriculum/skill-graph";
import { getSolvedProblemIds } from "@/lib/db/submissions-store";

export async function GET(request?: Request) {
  try {
    const solvedSet = getSolvedProblemIds();

    // Query DB for accepted submissions if available
    try {
      if (
        process.env.DATABASE_URL &&
        !process.env.DATABASE_URL.includes("mock_pass")
      ) {
        const acceptedSubmissions = await db
          .select({ problemId: submissions.problemId })
          .from(submissions)
          .where(eq(submissions.status, "ACCEPTED"));

        for (const sub of acceptedSubmissions) {
          solvedSet.add(sub.problemId);
        }
      }
    } catch {
      // Fallback to in-memory store
    }

    const categories = calculateRadarMastery(solvedSet);

    return NextResponse.json({
      categories,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch skill radar data" },
      { status: 500 }
    );
  }
}
