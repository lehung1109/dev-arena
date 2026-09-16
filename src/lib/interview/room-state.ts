/**
 * Mock Interview Room State & Timer Manager
 * Handles room code generation, timer logic, role transitions, and evaluation rubrics.
 */

export type InterviewRole = "candidate" | "interviewer";

export type InterviewRubricCategory =
  | "problemSolving"
  | "coding"
  | "communication"
  | "verification";

export interface RubricItem {
  score: number; // 1 to 5
  notes: string;
}

export interface InterviewRubric {
  problemSolving: RubricItem;
  coding: RubricItem;
  communication: RubricItem;
  verification: RubricItem;
}

export type HiringRecommendation =
  | "STRONG_HIRE"
  | "HIRE"
  | "LEANING_HIRE"
  | "NO_HIRE"
  | "STRONG_NO_HIRE";

export interface InterviewRoomState {
  roomId: string;
  problemSlug: string;
  currentRole: InterviewRole;
  timerRemainingSeconds: number;
  isTimerRunning: boolean;
  rubric: InterviewRubric;
  candidateNotes: string;
  interviewerPrivateNotes: string;
}

export const DEFAULT_INTERVIEW_RUBRIC: InterviewRubric = {
  problemSolving: {
    score: 3,
    notes: "Clarified constraints and identified appropriate algorithm strategy.",
  },
  coding: {
    score: 3,
    notes: "Clean syntax, proper variable naming, and idiomatic structure.",
  },
  communication: {
    score: 3,
    notes: "Articulated thoughts out loud and responded well to prompts.",
  },
  verification: {
    score: 3,
    notes: "Dry ran sample cases and considered boundary conditions.",
  },
};

export const RUBRIC_METADATA: Record<
  InterviewRubricCategory,
  { label: string; description: string; tips: string[] }
> = {
  problemSolving: {
    label: "Problem Solving & DSA",
    description:
      "Understanding requirements, constraints, edge cases, and selecting optimal data structures.",
    tips: [
      "Asks clarifying questions before coding",
      "Explores multiple approaches (brute force vs. optimal)",
      "Correctly identifies Time and Space complexity",
    ],
  },
  coding: {
    label: "Coding & Implementation",
    description:
      "Writing clean, modular, bug-free code with appropriate abstractions and idioms.",
    tips: [
      "Meaningful variable and function names",
      "Consistent formatting and modular structure",
      "Avoids unnecessary global state or side effects",
    ],
  },
  communication: {
    label: "Communication & Collaboration",
    description:
      "Thinking out loud, receptive to hints, explaining trade-offs clearly.",
    tips: [
      "Talks through intuition before typing",
      "Explains 'why' behind decisions, not just 'what'",
      "Receptive to interviewer guidance",
    ],
  },
  verification: {
    label: "Verification & Edge Cases",
    description:
      "Proactively testing code, tracing execution line-by-line, handling edge cases.",
    tips: [
      "Dry-runs code with example test cases",
      "Tests boundary conditions (empty, single, negative, duplicates)",
      "Spots and debugs own logical mistakes",
    ],
  },
};

/**
 * Generates a unique room code formatted as room-xxxxxx with 6 alphanumeric chars
 */
export function generateRoomCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `room-${suffix}`;
}

/**
 * Validates whether a room code follows the format room-xxxxxx
 */
export function isValidRoomCode(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  return /^room-[a-z0-9]{6}$/i.test(code.trim());
}

/**
 * Formats a duration in seconds to mm:ss display string (e.g. 2700 -> 45:00)
 */
export function formatInterviewTimer(seconds: number): string {
  if (seconds <= 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Toggles role between candidate and interviewer
 */
export function toggleUserRole(currentRole: InterviewRole): InterviewRole {
  return currentRole === "candidate" ? "interviewer" : "candidate";
}

/**
 * Creates initial state for an interview room with 45-minute timer
 */
export function createInterviewRoomState(
  roomId: string,
  problemSlug: string = "two-sum"
): InterviewRoomState {
  return {
    roomId,
    problemSlug,
    currentRole: "candidate",
    timerRemainingSeconds: 2700, // 45 minutes
    isTimerRunning: false,
    rubric: JSON.parse(JSON.stringify(DEFAULT_INTERVIEW_RUBRIC)),
    candidateNotes: "",
    interviewerPrivateNotes: "",
  };
}

/**
 * Updates a rubric category score (clamped to 1..5) and optional notes
 */
export function updateRubricScore(
  rubric: InterviewRubric,
  category: InterviewRubricCategory,
  score: number,
  notes?: string
): InterviewRubric {
  const clampedScore = Math.max(1, Math.min(5, Math.round(score)));
  const existingNotes = rubric[category]?.notes || "";

  return {
    ...rubric,
    [category]: {
      score: clampedScore,
      notes: notes !== undefined ? notes : existingNotes,
    },
  };
}

/**
 * Calculates the arithmetic mean across rubric categories
 */
export function calculateRubricAverage(rubric: InterviewRubric): number {
  const categories: InterviewRubricCategory[] = [
    "problemSolving",
    "coding",
    "communication",
    "verification",
  ];
  const total = categories.reduce((sum, cat) => sum + (rubric[cat]?.score || 0), 0);
  return Math.round((total / categories.length) * 10) / 10;
}

/**
 * Determines hiring recommendation based on rubric score average
 */
export function getRubricRecommendation(averageScore: number): HiringRecommendation {
  if (averageScore >= 4.5) return "STRONG_HIRE";
  if (averageScore >= 3.5) return "HIRE";
  if (averageScore >= 3.0) return "LEANING_HIRE";
  if (averageScore >= 2.0) return "NO_HIRE";
  return "STRONG_NO_HIRE";
}
