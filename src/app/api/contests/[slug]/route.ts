import { NextResponse } from "next/server";
import { SEEDED_CONTESTS } from "@/lib/contests/rating-engine";
import { db } from "@/lib/db/client";
import { contests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 1. Check seeded contests
    const seeded = SEEDED_CONTESTS.find((c) => c.slug === slug);
    if (seeded) {
      return NextResponse.json(seeded, { status: 200 });
    }

    // 2. Check database
    try {
      if (
        process.env.DATABASE_URL &&
        !process.env.DATABASE_URL.includes("mock_pass")
      ) {
        const rows = await db
          .select()
          .from(contests)
          .where(eq(contests.slug, slug))
          .limit(1);

        if (rows && rows.length > 0) {
          const r = rows[0];
          const weights = (r.problemWeights as Record<string, number>) || {};
          const problemCount = Object.keys(weights).length;
          const durationMinutes = Math.max(
            30,
            Math.round(
              (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) /
                60000
            )
          );

          const result = {
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
            problems: Object.entries(weights).map(([probSlug, pts]) => ({
              id: `prob-${probSlug}`,
              slug: probSlug,
              title: probSlug
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" "),
              difficulty: pts <= 150 ? "EASY" : pts <= 350 ? "MEDIUM" : "HARD",
              points: pts,
            })),
            leaderboard: [],
          };

          return NextResponse.json(result, { status: 200 });
        }
      }
    } catch {
      // Fallback
    }

    return NextResponse.json(
      { error: `Contest '${slug}' not found` },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch contest detail" },
      { status: 500 }
    );
  }
}
