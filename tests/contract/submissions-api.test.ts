import { describe, it, expect } from "vitest";
import { POST, GET as GET_SUBMISSIONS } from "@/app/api/submissions/route";
import { GET as GET_SUBMISSION_BY_ID } from "@/app/api/submissions/[id]/route";

describe("Submissions API Contract Tests", () => {
  let createdSubmissionId: string;

  describe("POST /api/submissions", () => {
    it("creates a submission record with valid payload and returns 201", async () => {
      const payload = {
        problemId: "two-sum",
        code: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
    map.set(nums[i], i);
  }
  return [];
}`,
        status: "ACCEPTED",
        runtimeMs: 14.5,
        memoryBytes: 2048,
        passedTestCases: 5,
        totalTestCases: 5,
        testResultsDetail: [
          { testCaseId: "tc-1", passed: true, executionTimeMs: 2.1 },
          { testCaseId: "tc-2", passed: true, executionTimeMs: 1.8 },
        ],
        astMetrics: {
          maxLoopDepth: 1,
          hasRecursion: false,
          syntaxValid: true,
        },
      };

      const request = new Request("http://localhost:3000/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty("id");
      expect(data.problemId).toBe("two-sum");
      expect(data.problemTitle).toBe("Two Sum");
      expect(data.status).toBe("ACCEPTED");
      expect(data.runtimeMs).toBe(14.5);
      expect(data.passedTestCases).toBe(5);
      expect(data.totalTestCases).toBe(5);
      expect(data).toHaveProperty("submittedAt");

      createdSubmissionId = data.id;
    });

    it("rejects invalid submission with 400 when missing required fields", async () => {
      const invalidPayload = {
        code: "function invalid() {}",
        // missing problemId, status, totalTestCases, etc.
      };

      const request = new Request("http://localhost:3000/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidPayload),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty("error");
    });

    it("rejects invalid status enum with 400", async () => {
      const payload = {
        problemId: "two-sum",
        code: "function twoSum() {}",
        status: "INVALID_STATUS_VALUE",
        passedTestCases: 0,
        totalTestCases: 5,
      };

      const request = new Request("http://localhost:3000/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/status/i);
    });
  });

  describe("GET /api/submissions", () => {
    it("returns submission history list with total count", async () => {
      const request = new Request("http://localhost:3000/api/submissions");
      const response = await GET_SUBMISSIONS(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("total");
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.total).toBeGreaterThanOrEqual(1);

      const first = data.items[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("problemId");
      expect(first).toHaveProperty("status");
      expect(first).toHaveProperty("submittedAt");
    });

    it("filters submissions by problemId query parameter", async () => {
      const request = new Request(
        "http://localhost:3000/api/submissions?problemId=two-sum"
      );
      const response = await GET_SUBMISSIONS(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.items)).toBe(true);
      for (const item of data.items) {
        expect(item.problemId).toBe("two-sum");
      }
    });
  });

  describe("GET /api/submissions/[id]", () => {
    it("returns complete submission detail for existing submission ID", async () => {
      expect(createdSubmissionId).toBeDefined();

      const request = new Request(
        `http://localhost:3000/api/submissions/${createdSubmissionId}`
      );
      const response = await GET_SUBMISSION_BY_ID(request, {
        params: Promise.resolve({ id: createdSubmissionId }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(createdSubmissionId);
      expect(data.problemId).toBe("two-sum");
      expect(data.status).toBe("ACCEPTED");
      expect(data).toHaveProperty("code");
      expect(data.code).toContain("twoSum");
      expect(data).toHaveProperty("testResultsDetail");
      expect(Array.isArray(data.testResultsDetail)).toBe(true);
      expect(data).toHaveProperty("astMetrics");
    });

    it("returns 404 for non-existent submission ID", async () => {
      const request = new Request(
        "http://localhost:3000/api/submissions/non-existent-sub-id"
      );
      const response = await GET_SUBMISSION_BY_ID(request, {
        params: Promise.resolve({ id: "non-existent-sub-id" }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toMatch(/not found/i);
    });
  });
});
