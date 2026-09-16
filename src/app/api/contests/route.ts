import { NextResponse } from "next/server";
import { SEEDED_CONTESTS } from "@/lib/contests/rating-engine";
import { db } from "@/lib/db/client";
import { contests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status")?.toUpperCase();

    let allContests = [...SEEDED_CONTESTS];

    // Attempt to query from DB if available and healthy
    try {
      if (
        process.env.DATABASE_URL &&
        !process.env.DATABASE_URL.includes("mock_pass")
      ) {
        const query = statusParam
          ? db
              .select()
              .from(contests)
              .where(
                eq(contests.status, statusParam as "UPCOMING" | "ONGOING" | "FINISHED")
              )
          : db.select().from(contests);

        const dbRows = await query;
        if (dbRows && dbRows.length > 0) {
          allContests = dbRows.map((r) => {
            const weights = (r.problemWeights as Record<string, number>) || {};
            const problemCount = Object.keys(weights).length;
            const durationMinutes = Math.max(
              30,
              Math.round(
                (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) /
                  60000
              )
            );
            return {
              id: r.id,
              slug: r.slug,
              title: r.title,
              description: r.description,
              startTime: new Date(r.startTime).toISOString(),
              endTime: new Date(r.endTime).toISOString(),
              status: r.status,
              durationMinutes,
              problemCount,
              participantCount: 50,
              problemWeights: weights,
              problems: [],
              leaderboard: [],
            };
          });
        }
      }
    } catch {
      // Fall back to seeded dataset on database error or offline mode
    }

    if (statusParam) {
      allContests = allContests.filter((c) => c.status === statusParam);
    }

    const summaries = allContests.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      startTime: c.startTime,
      endTime: c.endTime,
      status: c.status,
      durationMinutes: c.durationMinutes,
      problemCount: c.problemCount,
      participantCount: c.participantCount,
      problemWeights: c.problemWeights,
    }));

    return NextResponse.json({ contests: summaries }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch contests" },
      { status: 500 }
    );
  }
}
