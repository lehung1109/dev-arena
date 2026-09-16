import { describe, it, expect } from "vitest";
import {
  calculateContestScore,
  calculateStandings,
  calculateRatingDeltas,
  evaluateBadges,
  type ContestSubmission,
  type ParticipantScore,
  type RankedParticipant,
} from "@/lib/contests/rating-engine";

describe("Rating & Scoring Engine Unit Tests (TDD)", () => {
  describe("ICPC Penalty & Score Calculation", () => {
    const contestStartTime = new Date("2026-09-16T10:00:00.000Z");

    it("calculates accepted submission points with 0 penalty when solved on first attempt", () => {
      const submissions: ContestSubmission[] = [
        {
          problemId: "two-sum",
          points: 100,
          status: "ACCEPTED",
          submittedAt: new Date("2026-09-16T10:15:00.000Z"), // 15 mins after start
        },
      ];

      const result = calculateContestScore(submissions, contestStartTime);
      expect(result.score).toBe(100);
      expect(result.penaltyMinutes).toBe(15); // 15 min solve time + 0 failed attempts
      expect(result.problemStats["two-sum"]).toEqual({
        solved: true,
        attempts: 1,
        timeMinutes: 15,
      });
    });

    it("adds 10-minute penalty per prior failed attempt for an accepted problem", () => {
      const submissions: ContestSubmission[] = [
        {
          problemId: "valid-parentheses",
          points: 250,
          status: "WRONG_ANSWER",
          submittedAt: new Date("2026-09-16T10:10:00.000Z"), // attempt 1
        },
        {
          problemId: "valid-parentheses",
          points: 250,
          status: "TIME_LIMIT_EXCEEDED",
          submittedAt: new Date("2026-09-16T10:20:00.000Z"), // attempt 2
        },
        {
          problemId: "valid-parentheses",
          points: 250,
          status: "ACCEPTED",
          submittedAt: new Date("2026-09-16T10:35:00.000Z"), // attempt 3, 35 mins after start
        },
      ];

      const result = calculateContestScore(submissions, contestStartTime);
      expect(result.score).toBe(250);
      // 35 mins solve time + 2 failed attempts * 10 mins = 55 mins penalty
      expect(result.penaltyMinutes).toBe(55);
      expect(result.problemStats["valid-parentheses"]).toEqual({
        solved: true,
        attempts: 3,
        timeMinutes: 35,
      });
    });

    it("ignores submissions for a problem after its first accepted verdict", () => {
      const submissions: ContestSubmission[] = [
        {
          problemId: "two-sum",
          points: 100,
          status: "ACCEPTED",
          submittedAt: new Date("2026-09-16T10:12:00.000Z"),
        },
        {
          problemId: "two-sum",
          points: 100,
          status: "WRONG_ANSWER",
          submittedAt: new Date("2026-09-16T10:18:00.000Z"), // after accepted: should be ignored
        },
      ];

      const result = calculateContestScore(submissions, contestStartTime);
      expect(result.score).toBe(100);
      expect(result.penaltyMinutes).toBe(12);
      expect(result.problemStats["two-sum"].attempts).toBe(1);
    });

    it("does not add score or penalty for unaccepted problems", () => {
      const submissions: ContestSubmission[] = [
        {
          problemId: "container-with-most-water",
          points: 500,
          status: "WRONG_ANSWER",
          submittedAt: new Date("2026-09-16T10:25:00.000Z"),
        },
        {
          problemId: "container-with-most-water",
          points: 500,
          status: "RUNTIME_ERROR",
          submittedAt: new Date("2026-09-16T10:40:00.000Z"),
        },
      ];

      const result = calculateContestScore(submissions, contestStartTime);
      expect(result.score).toBe(0);
      expect(result.penaltyMinutes).toBe(0);
      expect(result.problemStats["container-with-most-water"]).toEqual({
        solved: false,
        attempts: 2,
        timeMinutes: 0,
      });
    });

    it("aggregates multiple problems correctly into total score and penalty", () => {
      const submissions: ContestSubmission[] = [
        // Problem 1: Solved on attempt 2 at min 20 -> 100 pts, penalty = 20 + 10 = 30
        {
          problemId: "two-sum",
          points: 100,
          status: "WRONG_ANSWER",
          submittedAt: new Date("2026-09-16T10:05:00.000Z"),
        },
        {
          problemId: "two-sum",
          points: 100,
          status: "ACCEPTED",
          submittedAt: new Date("2026-09-16T10:20:00.000Z"),
        },
        // Problem 2: Solved on attempt 1 at min 45 -> 250 pts, penalty = 45 + 0 = 45
        {
          problemId: "valid-parentheses",
          points: 250,
          status: "ACCEPTED",
          submittedAt: new Date("2026-09-16T10:45:00.000Z"),
        },
        // Problem 3: Unsolved -> 0 pts, 0 penalty
        {
          problemId: "container-with-most-water",
          points: 500,
          status: "TIME_LIMIT_EXCEEDED",
          submittedAt: new Date("2026-09-16T11:00:00.000Z"),
        },
      ];

      const result = calculateContestScore(submissions, contestStartTime);
      expect(result.score).toBe(350);
      expect(result.penaltyMinutes).toBe(75); // 30 + 45
    });
  });

  describe("Standings Sorting & Rank Assignment", () => {
    it("sorts primarily by score DESC and secondarily by penaltyMinutes ASC", () => {
      const participants: ParticipantScore[] = [
        { userId: "u1", username: "alice", score: 250, penaltyMinutes: 40 },
        { userId: "u2", username: "bob", score: 500, penaltyMinutes: 90 },
        { userId: "u3", username: "charlie", score: 250, penaltyMinutes: 25 },
        { userId: "u4", username: "david", score: 100, penaltyMinutes: 10 },
      ];

      const standings = calculateStandings(participants);

      expect(standings.map((s) => s.username)).toEqual([
        "bob", // 500 pts
        "charlie", // 250 pts, 25 penalty
        "alice", // 250 pts, 40 penalty
        "david", // 100 pts
      ]);

      expect(standings[0].rank).toBe(1);
      expect(standings[1].rank).toBe(2);
      expect(standings[2].rank).toBe(3);
      expect(standings[3].rank).toBe(4);
    });

    it("assigns identical ranks to tied participants with equal score and penalty", () => {
      const participants: ParticipantScore[] = [
        { userId: "u1", username: "alice", score: 200, penaltyMinutes: 30 },
        { userId: "u2", username: "bob", score: 200, penaltyMinutes: 30 },
        { userId: "u3", username: "charlie", score: 100, penaltyMinutes: 15 },
      ];

      const standings = calculateStandings(participants);

      expect(standings[0].rank).toBe(1);
      expect(standings[1].rank).toBe(1);
      expect(standings[2].rank).toBe(3); // standard competition ranking
    });

    it("handles empty participants list gracefully", () => {
      const standings = calculateStandings([]);
      expect(standings).toEqual([]);
    });
  });

  describe("Elo/Glicko Rating Deltas Calculation", () => {
    it("rewards higher ranked participant with positive delta and penalizes lower ranked with negative delta", () => {
      const participants: RankedParticipant[] = [
        { userId: "u1", currentRating: 1400, rank: 1 },
        { userId: "u2", currentRating: 1400, rank: 2 },
      ];

      const deltas = calculateRatingDeltas(participants);

      expect(deltas.get("u1")!).toBeGreaterThan(0);
      expect(deltas.get("u2")!).toBeLessThan(0);
    });

    it("maintains zero-sum rating exchange between equal rated participants", () => {
      const participants: RankedParticipant[] = [
        { userId: "u1", currentRating: 1500, rank: 1 },
        { userId: "u2", currentRating: 1500, rank: 2 },
      ];

      const deltas = calculateRatingDeltas(participants);
      const sum = deltas.get("u1")! + deltas.get("u2")!;
      expect(Math.abs(sum)).toBeLessThanOrEqual(1); // zero-sum within rounding
    });

    it("grants larger rating increase when a lower-rated participant defeats a higher-rated participant", () => {
      // Underdog (1200) beats favorite (1800)
      const underdogWins: RankedParticipant[] = [
        { userId: "underdog", currentRating: 1200, rank: 1 },
        { userId: "favorite", currentRating: 1800, rank: 2 },
      ];
      const underdogDeltas = calculateRatingDeltas(underdogWins);

      // Favorite (1800) beats underdog (1200)
      const favoriteWins: RankedParticipant[] = [
        { userId: "favorite", currentRating: 1800, rank: 1 },
        { userId: "underdog", currentRating: 1200, rank: 2 },
      ];
      const favoriteDeltas = calculateRatingDeltas(favoriteWins);

      expect(underdogDeltas.get("underdog")!).toBeGreaterThan(
        favoriteDeltas.get("favorite")!
      );
    });

    it("enforces delta bounds to prevent extreme rating swings (capped at [-100, 100])", () => {
      const participants: RankedParticipant[] = [
        { userId: "u1", currentRating: 800, rank: 1 },
        { userId: "u2", currentRating: 2800, rank: 2 },
      ];

      const deltas = calculateRatingDeltas(participants);
      expect(deltas.get("u1")!).toBeLessThanOrEqual(100);
      expect(deltas.get("u2")!).toBeGreaterThanOrEqual(-100);
    });

    it("returns empty map for single or zero participants", () => {
      expect(calculateRatingDeltas([]).size).toBe(0);
      expect(
        calculateRatingDeltas([{ userId: "u1", currentRating: 1500, rank: 1 }])
          .get("u1")
      ).toBe(0);
    });
  });

  describe("Badge Evaluation Rules", () => {
    it("evaluates 'First Blood' when totalSolved >= 1", () => {
      const badgesZero = evaluateBadges({
        streakCount: 0,
        totalSolved: 0,
        rating: 1200,
        contestRanks: [],
      });
      const firstBloodZero = badgesZero.find((b) => b.slug === "first-blood");
      expect(firstBloodZero?.unlocked).toBe(false);

      const badgesOne = evaluateBadges({
        streakCount: 0,
        totalSolved: 1,
        rating: 1200,
        contestRanks: [],
      });
      const firstBloodOne = badgesOne.find((b) => b.slug === "first-blood");
      expect(firstBloodOne?.unlocked).toBe(true);
    });

    it("evaluates 'Streak 7' when streakCount >= 7", () => {
      const badges5 = evaluateBadges({
        streakCount: 5,
        totalSolved: 10,
        rating: 1200,
        contestRanks: [],
      });
      const streak5 = badges5.find((b) => b.slug === "streak-7");
      expect(streak5?.unlocked).toBe(false);
      expect(streak5?.progress?.current).toBe(5);
      expect(streak5?.progress?.target).toBe(7);

      const badges7 = evaluateBadges({
        streakCount: 7,
        totalSolved: 10,
        rating: 1200,
        contestRanks: [],
      });
      const streak7 = badges7.find((b) => b.slug === "streak-7");
      expect(streak7?.unlocked).toBe(true);
    });

    it("evaluates 'Century Club' when totalSolved >= 100", () => {
      const badges99 = evaluateBadges({
        streakCount: 10,
        totalSolved: 99,
        rating: 1500,
        contestRanks: [],
      });
      const century99 = badges99.find((b) => b.slug === "century-club");
      expect(century99?.unlocked).toBe(false);
      expect(century99?.progress?.current).toBe(99);
      expect(century99?.progress?.target).toBe(100);

      const badges100 = evaluateBadges({
        streakCount: 10,
        totalSolved: 100,
        rating: 1500,
        contestRanks: [],
      });
      const century100 = badges100.find((b) => b.slug === "century-club");
      expect(century100?.unlocked).toBe(true);
    });

    it("evaluates 'Contest Champion' when user placed rank 1 in at least one contest", () => {
      const badgesNoWin = evaluateBadges({
        streakCount: 3,
        totalSolved: 20,
        rating: 1600,
        contestRanks: [2, 4, 8],
      });
      const championNoWin = badgesNoWin.find(
        (b) => b.slug === "contest-champion"
      );
      expect(championNoWin?.unlocked).toBe(false);

      const badgesWin = evaluateBadges({
        streakCount: 3,
        totalSolved: 20,
        rating: 1600,
        contestRanks: [5, 1, 3],
      });
      const championWin = badgesWin.find((b) => b.slug === "contest-champion");
      expect(championWin?.unlocked).toBe(true);
    });
  });
});
