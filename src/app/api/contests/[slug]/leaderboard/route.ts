import { NextResponse } from "next/server";
import {
  SEEDED_CONTESTS,
  calculateStandings,
} from "@/lib/contests/rating-engine";
import { db } from "@/lib/db/client";
import { contestParticipations, contests, users } from "@/lib/db/schema";
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
      // Ensure leaderboard is properly ranked
      const ranked = calculateStandings(seeded.leaderboard);
      const enrichedLeaderboard = ranked.map((entry) => {
        const original = seeded.leaderboard.find(
          (item) => item.userId === entry.userId
        );
        return {
          ...entry,
          avatarUrl: original?.avatarUrl,
          ratingDelta: original?.ratingDelta,
          problemStats: original?.problemStats,
        };
      });

      return NextResponse.json(
        {
          contestSlug: slug,
          contestTitle: seeded.title,
          leaderboard: enrichedLeaderboard,
        },
        { status: 200 }
      );
    }

    // 2. Check database
    try {
      if (
        process.env.DATABASE_URL &&
        !process.env.DATABASE_URL.includes("mock_pass")
      ) {
        const contestRows = await db
          .select()
          .from(contests)
          .where(eq(contests.slug, slug))
          .limit(1);

        if (contestRows && contestRows.length > 0) {
          const contest = contestRows[0];
          const partRows = await db
            .select({
              userId: contestParticipations.userId,
              score: contestParticipations.score,
              penaltyMinutes: contestParticipations.penaltyMinutes,
              ratingDelta: contestParticipations.ratingDelta,
              username: users.username,
              avatarUrl: users.avatarUrl,
            })
            .from(contestParticipations)
            .leftJoin(users, eq(contestParticipations.userId, users.id))
            .where(eq(contestParticipations.contestId, contest.id));

          const participations = partRows.map((r) => ({
            userId: r.userId,
            username: r.username || `user-${r.userId.slice(0, 6)}`,
            score: r.score,
            penaltyMinutes: r.penaltyMinutes,
            avatarUrl: r.avatarUrl ?? undefined,
            ratingDelta: r.ratingDelta ?? undefined,
          }));

          const ranked = calculateStandings(participations);
          const merged = ranked.map((entry) => {
            const original = participations.find(
              (p) => p.userId === entry.userId
            );
            return {
              ...entry,
              avatarUrl: original?.avatarUrl,
              ratingDelta: original?.ratingDelta,
            };
          });

          return NextResponse.json(
            {
              contestSlug: slug,
              contestTitle: contest.title,
              leaderboard: merged,
            },
            { status: 200 }
          );
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
      { error: error?.message || "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
