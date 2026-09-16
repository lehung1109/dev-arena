import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/problems/[slug]/route";

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
