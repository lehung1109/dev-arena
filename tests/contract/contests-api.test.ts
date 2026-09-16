import { describe, it, expect } from "vitest";
import { GET as GET_CONTESTS } from "@/app/api/contests/route";
import { GET as GET_CONTEST_BY_SLUG } from "@/app/api/contests/[slug]/route";
import { GET as GET_CONTEST_LEADERBOARD } from "@/app/api/contests/[slug]/leaderboard/route";

describe("Contests API Contract Tests: GET /api/contests", () => {
  it("returns 200 with list of contests including status and problem weights", async () => {
    const request = new Request("http://localhost:3000/api/contests");
    const response = await GET_CONTESTS(request);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("contests");
    expect(Array.isArray(data.contests)).toBe(true);
    expect(data.contests.length).toBeGreaterThanOrEqual(3);

    for (const contest of data.contests) {
      expect(typeof contest.id).toBe("string");
      expect(typeof contest.slug).toBe("string");
      expect(typeof contest.title).toBe("string");
      expect(typeof contest.description).toBe("string");
      expect(typeof contest.startTime).toBe("string");
      expect(typeof contest.endTime).toBe("string");
      expect(["UPCOMING", "ONGOING", "FINISHED"]).toContain(contest.status);
      expect(typeof contest.durationMinutes).toBe("number");
      expect(typeof contest.problemCount).toBe("number");
      expect(typeof contest.participantCount).toBe("number");
      expect(typeof contest.problemWeights).toBe("object");
    }
  });

  it("filters contests by status query parameter", async () => {
    // Filter ONGOING
    const ongoingReq = new Request(
      "http://localhost:3000/api/contests?status=ONGOING"
    );
    const ongoingRes = await GET_CONTESTS(ongoingReq);
    expect(ongoingRes.status).toBe(200);
    const ongoingData = await ongoingRes.json();
    expect(ongoingData.contests.every((c: any) => c.status === "ONGOING")).toBe(
      true
    );

    // Filter UPCOMING
    const upcomingReq = new Request(
      "http://localhost:3000/api/contests?status=UPCOMING"
    );
    const upcomingRes = await GET_CONTESTS(upcomingReq);
    expect(upcomingRes.status).toBe(200);
    const upcomingData = await upcomingRes.json();
    expect(upcomingData.contests.every((c: any) => c.status === "UPCOMING")).toBe(
      true
    );

    // Filter FINISHED
    const finishedReq = new Request(
      "http://localhost:3000/api/contests?status=FINISHED"
    );
    const finishedRes = await GET_CONTESTS(finishedReq);
    expect(finishedRes.status).toBe(200);
    const finishedData = await finishedRes.json();
    expect(finishedData.contests.every((c: any) => c.status === "FINISHED")).toBe(
      true
    );
  });
});

describe("Contests API Contract Tests: GET /api/contests/[slug]", () => {
  it("returns 200 with full contest detail and problem list for a valid slug", async () => {
    const request = new Request(
      "http://localhost:3000/api/contests/weekly-arena-1"
    );
    const response = await GET_CONTEST_BY_SLUG(request, {
      params: Promise.resolve({ slug: "weekly-arena-1" }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.slug).toBe("weekly-arena-1");
    expect(typeof data.title).toBe("string");
    expect(typeof data.description).toBe("string");
    expect(typeof data.startTime).toBe("string");
    expect(typeof data.endTime).toBe("string");
    expect(data.status).toBe("ONGOING");
    expect(Array.isArray(data.problems)).toBe(true);
    expect(data.problems.length).toBeGreaterThanOrEqual(1);

    for (const prob of data.problems) {
      expect(typeof prob.id).toBe("string");
      expect(typeof prob.slug).toBe("string");
      expect(typeof prob.title).toBe("string");
      expect(typeof prob.difficulty).toBe("string");
      expect(typeof prob.points).toBe("number");
    }
  });

  it("returns 404 for nonexistent contest slug", async () => {
    const request = new Request(
      "http://localhost:3000/api/contests/non-existent-contest"
    );
    const response = await GET_CONTEST_BY_SLUG(request, {
      params: Promise.resolve({ slug: "non-existent-contest" }),
    });

    expect(response.status).toBe(404);
  });
});

describe("Contests API Contract Tests: GET /api/contests/[slug]/leaderboard", () => {
  it("returns 200 with ranked participants sorted by rank ascending", async () => {
    const request = new Request(
      "http://localhost:3000/api/contests/weekly-arena-1/leaderboard"
    );
    const response = await GET_CONTEST_LEADERBOARD(request, {
      params: Promise.resolve({ slug: "weekly-arena-1" }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.contestSlug).toBe("weekly-arena-1");
    expect(Array.isArray(data.leaderboard)).toBe(true);
    expect(data.leaderboard.length).toBeGreaterThan(0);

    let prevRank = 0;
    for (const row of data.leaderboard) {
      expect(typeof row.rank).toBe("number");
      expect(row.rank).toBeGreaterThanOrEqual(prevRank);
      prevRank = row.rank;

      expect(typeof row.userId).toBe("string");
      expect(typeof row.username).toBe("string");
      expect(typeof row.score).toBe("number");
      expect(typeof row.penaltyMinutes).toBe("number");
    }
  });

  it("returns 404 when requesting leaderboard for unknown contest", async () => {
    const request = new Request(
      "http://localhost:3000/api/contests/unknown-contest-xyz/leaderboard"
    );
    const response = await GET_CONTEST_LEADERBOARD(request, {
      params: Promise.resolve({ slug: "unknown-contest-xyz" }),
    });

    expect(response.status).toBe(404);
  });
});
