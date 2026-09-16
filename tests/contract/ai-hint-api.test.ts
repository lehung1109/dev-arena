import { describe, it, expect } from "vitest";
import { POST as POST_AI_HINT } from "@/app/api/ai/hint/route";

describe("AI Hint API Contract Tests: POST /api/ai/hint", () => {
  it("returns 200 with hint, tier, guidanceType, and timestamp for valid request", async () => {
    const request = new Request("http://localhost:3000/api/ai/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemSlug: "two-sum",
        userCode: "function twoSum(nums, target) {}",
        tier: 1,
      }),
    });

    const response = await POST_AI_HINT(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("hint");
    expect(typeof data.hint).toBe("string");
    expect(data.hint.length).toBeGreaterThan(10);
    expect(data.tier).toBe(1);
    expect(data.guidanceType).toBe("conceptual_nudge");
    expect(data).toHaveProperty("timestamp");
    expect(typeof data.timestamp).toBe("string");

    // Anti-spoiler guarantee
    expect(data.hint).not.toMatch(/```[a-z]*[\s\S]*?```/);
    expect(data.hint).not.toContain("function twoSum");
  });

  it("returns 200 for tier 2 (algorithm pattern) and tier 3 (pseudocode flow)", async () => {
    const t2Request = new Request("http://localhost:3000/api/ai/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemSlug: "valid-parentheses",
        tier: 2,
      }),
    });
    const t2Res = await POST_AI_HINT(t2Request);
    expect(t2Res.status).toBe(200);
    const t2Data = await t2Res.json();
    expect(t2Data.tier).toBe(2);
    expect(t2Data.guidanceType).toBe("algorithm_pattern");

    const t3Request = new Request("http://localhost:3000/api/ai/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemSlug: "reverse-linked-list",
        tier: 3,
      }),
    });
    const t3Res = await POST_AI_HINT(t3Request);
    expect(t3Res.status).toBe(200);
    const t3Data = await t3Res.json();
    expect(t3Data.tier).toBe(3);
    expect(t3Data.guidanceType).toBe("pseudocode_flow");
  });

  it("handles free-form follow-up questions within tutor context", async () => {
    const request = new Request("http://localhost:3000/api/ai/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemSlug: "two-sum",
        tier: 1,
        question: "Why does brute force take O(N^2) time?",
      }),
    });

    const response = await POST_AI_HINT(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.hint).toBeDefined();
    expect(typeof data.hint).toBe("string");
  });

  it("rejects request with missing problemSlug with 400 Bad Request", async () => {
    const request = new Request("http://localhost:3000/api/ai/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tier: 1,
      }),
    });

    const response = await POST_AI_HINT(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error");
    expect(data.error.toLowerCase()).toMatch(/problemslug/i);
  });

  it("rejects invalid hint tier with 400 Bad Request", async () => {
    const invalidTiers = [0, 4, 99, "one", null];

    for (const tier of invalidTiers) {
      const request = new Request("http://localhost:3000/api/ai/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug: "two-sum",
          tier,
        }),
      });

      const response = await POST_AI_HINT(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error.toLowerCase()).toMatch(/tier/i);
    }
  });

  it("strictly enforces anti-spoiler guarantee on response", async () => {
    const request = new Request("http://localhost:3000/api/ai/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemSlug: "maximum-subarray",
        tier: 3,
      }),
    });

    const response = await POST_AI_HINT(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.hint).not.toMatch(/```[a-z]*[\s\S]*?```/);
    expect(data.hint).not.toMatch(/for\s*\(let\s+i/);
  });
});
