import { describe, it, expect } from "vitest";
import {
  generateRoomCode,
  isValidRoomCode,
  formatInterviewTimer,
  toggleUserRole,
  createInterviewRoomState,
  updateRubricScore,
  calculateRubricAverage,
  getRubricRecommendation,
  DEFAULT_INTERVIEW_RUBRIC,
  type InterviewRubricCategory,
} from "@/lib/interview/room-state";

describe("Interview Room State: Room Code Generation & Validation", () => {
  it("generates a valid unique room code with prefix 'room-' and alphanumeric suffix", () => {
    const code1 = generateRoomCode();
    const code2 = generateRoomCode();

    expect(typeof code1).toBe("string");
    expect(code1.startsWith("room-")).toBe(true);
    expect(code1.length).toBe(11); // "room-" (5) + 6 chars = 11
    expect(code1).not.toBe(code2);
  });

  it("validates room code format correctly", () => {
    expect(isValidRoomCode("room-abcdef")).toBe(true);
    expect(isValidRoomCode("room-123456")).toBe(true);
    expect(isValidRoomCode("room-ab12cd")).toBe(true);

    expect(isValidRoomCode("")).toBe(false);
    expect(isValidRoomCode("invalid-code")).toBe(false);
    expect(isValidRoomCode("room-abc")).toBe(false); // too short
    expect(isValidRoomCode("room-abcdefghij")).toBe(false); // too long
    expect(isValidRoomCode("ROOM-ABCDEF")).toBe(true); // case insensitive check
  });
});

describe("Interview Room State: Timer Management & Formatting", () => {
  it("formats seconds into mm:ss accurately", () => {
    expect(formatInterviewTimer(2700)).toBe("45:00");
    expect(formatInterviewTimer(2699)).toBe("44:59");
    expect(formatInterviewTimer(605)).toBe("10:05");
    expect(formatInterviewTimer(60)).toBe("01:00");
    expect(formatInterviewTimer(9)).toBe("00:09");
    expect(formatInterviewTimer(0)).toBe("00:00");
    expect(formatInterviewTimer(-10)).toBe("00:00");
  });

  it("initializes room state with 45-minute countdown timer", () => {
    const state = createInterviewRoomState("room-abc123", "two-sum");
    expect(state.roomId).toBe("room-abc123");
    expect(state.problemSlug).toBe("two-sum");
    expect(state.timerRemainingSeconds).toBe(2700); // 45 minutes
    expect(state.isTimerRunning).toBe(false);
  });
});

describe("Interview Room State: Role Management", () => {
  it("toggles role between candidate and interviewer", () => {
    expect(toggleUserRole("candidate")).toBe("interviewer");
    expect(toggleUserRole("interviewer")).toBe("candidate");
  });

  it("initializes default role as candidate", () => {
    const state = createInterviewRoomState("room-abc123", "two-sum");
    expect(state.currentRole).toBe("candidate");
  });
});

describe("Interview Room State: Evaluation Rubric", () => {
  it("provides standard 4-category evaluation rubric", () => {
    expect(DEFAULT_INTERVIEW_RUBRIC.problemSolving).toBeDefined();
    expect(DEFAULT_INTERVIEW_RUBRIC.coding).toBeDefined();
    expect(DEFAULT_INTERVIEW_RUBRIC.communication).toBeDefined();
    expect(DEFAULT_INTERVIEW_RUBRIC.verification).toBeDefined();
  });

  it("updates rubric category score and notes with clamping to [1, 5]", () => {
    let rubric = { ...DEFAULT_INTERVIEW_RUBRIC };

    rubric = updateRubricScore(rubric, "problemSolving", 4, "Understood optimal hash map approach");
    expect(rubric.problemSolving.score).toBe(4);
    expect(rubric.problemSolving.notes).toBe("Understood optimal hash map approach");

    // Clamps above 5
    rubric = updateRubricScore(rubric, "coding", 6);
    expect(rubric.coding.score).toBe(5);

    // Clamps below 1
    rubric = updateRubricScore(rubric, "verification", 0);
    expect(rubric.verification.score).toBe(1);
  });

  it("calculates rubric average score accurately", () => {
    const rubric = {
      problemSolving: { score: 4, notes: "" },
      coding: { score: 5, notes: "" },
      communication: { score: 3, notes: "" },
      verification: { score: 4, notes: "" },
    };

    const avg = calculateRubricAverage(rubric);
    expect(avg).toBe(4.0);
  });

  it("returns appropriate hiring recommendation based on rubric score", () => {
    expect(getRubricRecommendation(4.8)).toBe("STRONG_HIRE");
    expect(getRubricRecommendation(4.0)).toBe("HIRE");
    expect(getRubricRecommendation(3.2)).toBe("LEANING_HIRE");
    expect(getRubricRecommendation(2.5)).toBe("NO_HIRE");
    expect(getRubricRecommendation(1.5)).toBe("STRONG_NO_HIRE");
  });
});
