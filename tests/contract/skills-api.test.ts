import { describe, it, expect } from "vitest";
import { GET as GET_SKILL_TREE } from "@/app/api/skills/tree/route";
import { GET as GET_SKILL_RADAR } from "@/app/api/skills/radar/route";

describe("Skills API Contract Tests: GET /api/skills/tree", () => {
  it("returns 200 with SkillTreeNode array adhering to OpenAPI contract", async () => {
    const request = new Request("http://localhost:3000/api/skills/tree");
    const response = await GET_SKILL_TREE(request);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("nodes");
    expect(Array.isArray(data.nodes)).toBe(true);
    expect(data.nodes.length).toBeGreaterThanOrEqual(6);

    for (const node of data.nodes) {
      // Contract fields from contracts/skills-api.yaml -> SkillTreeNode
      expect(typeof node.id).toBe("string");
      expect(typeof node.topicName).toBe("string");
      expect(typeof node.description).toBe("string");
      expect(typeof node.icon).toBe("string");
      expect(Array.isArray(node.prerequisites)).toBe(true);
      expect(typeof node.requiredSolves).toBe("number");
      expect(typeof node.solvedCount).toBe("number");
      expect(typeof node.isUnlocked).toBe("boolean");
      expect(typeof node.masteryScore).toBe("number");
      expect(node.masteryScore).toBeGreaterThanOrEqual(0);
      expect(node.masteryScore).toBeLessThanOrEqual(100);
    }

    // Root node (e.g. arrays_hashing) must be unlocked
    const rootNode = data.nodes.find((n: any) => n.id === "arrays_hashing");
    expect(rootNode).toBeDefined();
    expect(rootNode.isUnlocked).toBe(true);
  });
});

describe("Skills API Contract Tests: GET /api/skills/radar", () => {
  it("returns 200 with SkillCategoryMastery array adhering to OpenAPI contract", async () => {
    const request = new Request("http://localhost:3000/api/skills/radar");
    const response = await GET_SKILL_RADAR(request);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("categories");
    expect(Array.isArray(data.categories)).toBe(true);
    expect(data.categories.length).toBeGreaterThanOrEqual(6);

    for (const cat of data.categories) {
      // Contract fields from contracts/skills-api.yaml -> SkillCategoryMastery
      expect(typeof cat.category).toBe("string");
      expect(typeof cat.score).toBe("number");
      expect(typeof cat.solvedCount).toBe("number");
      expect(typeof cat.totalCount).toBe("number");
      expect(cat.score).toBeGreaterThanOrEqual(0);
      expect(cat.score).toBeLessThanOrEqual(100);
      expect(cat.solvedCount).toBeGreaterThanOrEqual(0);
      expect(cat.totalCount).toBeGreaterThanOrEqual(1);
    }
  });
});
