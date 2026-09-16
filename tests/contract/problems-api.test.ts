import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/problems/[slug]/route";
import { GET as GET_TEST_CASES } from "@/app/api/problems/[slug]/test-cases/route";

describe("Problems API Contract Tests: GET /api/problems/[slug]", () => {
  it("returns 200 with complete problem details for an existing slug", async () => {
    const request = new Request("http://localhost:3000/api/problems/two-sum");
    const response = await GET(request, {
      params: Promise.resolve({ slug: "two-sum" }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("id");
    expect(data.slug).toBe("two-sum");
    expect(data.title).toBe("Two Sum");
    expect(data.difficulty).toBe("EASY");
    expect(Array.isArray(data.topicTags)).toBe(true);
    expect(data.topicTags).toContain("Arrays");
    expect(data.starterCode).toContain("twoSum");
    expect(data.functionName).toBe("twoSum");
    expect(typeof data.description).toBe("string");
    expect(data.description.length).toBeGreaterThan(20);
    expect(Array.isArray(data.hints)).toBe(true);
    expect(Array.isArray(data.publicTestCases)).toBe(true);
    expect(data.publicTestCases.length).toBeGreaterThanOrEqual(1);

    // Verify all returned test cases are public and contain required fields
    for (const tc of data.publicTestCases) {
      expect(tc).toHaveProperty("id");
      expect(tc).toHaveProperty("input");
      expect(tc).toHaveProperty("expectedOutput");
      expect(tc.isPublic).toBe(true);
      expect(typeof tc.orderIndex).toBe("number");
    }
  });

  it("returns 200 with details for valid-parentheses", async () => {
    const request = new Request("http://localhost:3000/api/problems/valid-parentheses");
    const response = await GET(request, {
      params: Promise.resolve({ slug: "valid-parentheses" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.slug).toBe("valid-parentheses");
    expect(data.functionName).toBe("isValid");
    expect(data.publicTestCases.length).toBeGreaterThanOrEqual(1);
  });

  it("returns 404 when problem slug does not exist", async () => {
    const request = new Request("http://localhost:3000/api/problems/non-existent-slug-xyz");
    const response = await GET(request, {
      params: Promise.resolve({ slug: "non-existent-slug-xyz" }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toHaveProperty("error");
    expect(data.error).toMatch(/not found/i);
  });
});

describe("Problems API Contract Tests: GET /api/problems/[slug]/test-cases", () => {
  it("returns only public test cases when scope is public or omitted", async () => {
    const request = new Request("http://localhost:3000/api/problems/two-sum/test-cases?scope=public");
    const response = await GET_TEST_CASES(request, {
      params: Promise.resolve({ slug: "two-sum" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("testCases");
    expect(Array.isArray(data.testCases)).toBe(true);
    expect(data.testCases.length).toBeGreaterThanOrEqual(1);

    // All returned test cases must be public
    for (const tc of data.testCases) {
      expect(tc.isPublic).toBe(true);
      expect(tc).toHaveProperty("input");
      expect(tc).toHaveProperty("expectedOutput");
    }

    expect(data).toHaveProperty("benchmarkCases");
    expect(Array.isArray(data.benchmarkCases)).toBe(true);
  });

  it("returns all test cases (public + hidden) when scope=all for submission verification", async () => {
    const request = new Request("http://localhost:3000/api/problems/two-sum/test-cases?scope=all");
    const response = await GET_TEST_CASES(request, {
      params: Promise.resolve({ slug: "two-sum" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("testCases");
    expect(Array.isArray(data.testCases)).toBe(true);

    // In SEED_PROBLEMS, two-sum has 3 public and 2 hidden test cases (total 5)
    expect(data.testCases.length).toBeGreaterThanOrEqual(5);

    const hasHidden = data.testCases.some((tc: any) => tc.isPublic === false);
    expect(hasHidden).toBe(true);
    const hasPublic = data.testCases.some((tc: any) => tc.isPublic === true);
    expect(hasPublic).toBe(true);
  });

  it("returns 404 when slug does not exist for test-cases endpoint", async () => {
    const request = new Request("http://localhost:3000/api/problems/unknown-slug/test-cases");
    const response = await GET_TEST_CASES(request, {
      params: Promise.resolve({ slug: "unknown-slug" }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toHaveProperty("error");
    expect(data.error).toMatch(/not found/i);
  });
});
