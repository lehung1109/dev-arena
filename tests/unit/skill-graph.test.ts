import { describe, it, expect } from "vitest";
import {
  checkCycle,
  evaluateSkillTree,
  calculateTopicMastery,
  calculateRadarMastery,
  CANONICAL_SKILL_NODES,
  type SkillNode,
} from "@/lib/curriculum/skill-graph";

describe("Skill Graph DAG Engine Unit Tests (TDD)", () => {
  const mockNodes: SkillNode[] = [
    {
      id: "arrays_hashing",
      topicName: "Arrays & Hashing",
      description: "Array fundamentals",
      icon: "Layers",
      prerequisites: [],
      requiredSolves: 2,
      totalProblems: 4,
    },
    {
      id: "two_pointers",
      topicName: "Two Pointers",
      description: "Two pointer technique",
      icon: "Split",
      prerequisites: ["arrays_hashing"],
      requiredSolves: 2,
      totalProblems: 3,
    },
    {
      id: "sliding_window",
      topicName: "Sliding Window",
      description: "Sliding window patterns",
      icon: "Maximize",
      prerequisites: ["two_pointers"],
      requiredSolves: 2,
      totalProblems: 3,
    },
  ];

  describe("evaluateSkillTree: DAG Prerequisite Evaluation", () => {
    it("unlocks root nodes with no prerequisites unconditionally", () => {
      const emptyProgress = new Map<string, { solvedCount: number }>();
      const evaluated = evaluateSkillTree(mockNodes, emptyProgress);

      const rootNode = evaluated.find((n) => n.id === "arrays_hashing");
      expect(rootNode).toBeDefined();
      expect(rootNode?.isUnlocked).toBe(true);
      expect(rootNode?.solvedCount).toBe(0);
      expect(rootNode?.masteryScore).toBe(0);
    });

    it("keeps dependent nodes locked when prerequisite solvedCount < requiredSolves", () => {
      const progress = new Map([
        ["arrays_hashing", { solvedCount: 1 }], // required is 2
      ]);
      const evaluated = evaluateSkillTree(mockNodes, progress);

      const twoPointers = evaluated.find((n) => n.id === "two_pointers");
      expect(twoPointers).toBeDefined();
      expect(twoPointers?.isUnlocked).toBe(false);
      expect(twoPointers?.solvedCount).toBe(0);

      const slidingWindow = evaluated.find((n) => n.id === "sliding_window");
      expect(slidingWindow?.isUnlocked).toBe(false);
    });

    it("unlocks dependent nodes when prerequisite meets or exceeds requiredSolves", () => {
      const progress = new Map([
        ["arrays_hashing", { solvedCount: 2 }], // meets required 2
      ]);
      const evaluated = evaluateSkillTree(mockNodes, progress);

      const rootNode = evaluated.find((n) => n.id === "arrays_hashing");
      expect(rootNode?.isUnlocked).toBe(true);

      const twoPointers = evaluated.find((n) => n.id === "two_pointers");
      expect(twoPointers?.isUnlocked).toBe(true);

      // sliding_window depends on two_pointers, which has 0 solved (required 2)
      const slidingWindow = evaluated.find((n) => n.id === "sliding_window");
      expect(slidingWindow?.isUnlocked).toBe(false);
    });

    it("unlocks multi-level transitive dependencies when all ancestors meet requirements", () => {
      const progress = new Map([
        ["arrays_hashing", { solvedCount: 3 }],
        ["two_pointers", { solvedCount: 2 }],
      ]);
      const evaluated = evaluateSkillTree(mockNodes, progress);

      const rootNode = evaluated.find((n) => n.id === "arrays_hashing");
      const twoPointers = evaluated.find((n) => n.id === "two_pointers");
      const slidingWindow = evaluated.find((n) => n.id === "sliding_window");

      expect(rootNode?.isUnlocked).toBe(true);
      expect(twoPointers?.isUnlocked).toBe(true);
      expect(slidingWindow?.isUnlocked).toBe(true);
    });

    it("handles multi-prerequisite nodes requiring all parents to satisfy conditions", () => {
      const multiPrereqNodes: SkillNode[] = [
        {
          id: "node_a",
          topicName: "Node A",
          description: "A",
          icon: "A",
          prerequisites: [],
          requiredSolves: 2,
          totalProblems: 2,
        },
        {
          id: "node_b",
          topicName: "Node B",
          description: "B",
          icon: "B",
          prerequisites: [],
          requiredSolves: 2,
          totalProblems: 2,
        },
        {
          id: "node_c",
          topicName: "Node C",
          description: "C",
          icon: "C",
          prerequisites: ["node_a", "node_b"],
          requiredSolves: 1,
          totalProblems: 2,
        },
      ];

      // Only node_a satisfied
      const partialProgress = new Map([
        ["node_a", { solvedCount: 2 }],
        ["node_b", { solvedCount: 1 }], // needs 2
      ]);
      const evalPartial = evaluateSkillTree(multiPrereqNodes, partialProgress);
      expect(evalPartial.find((n) => n.id === "node_c")?.isUnlocked).toBe(false);

      // Both satisfied
      const fullProgress = new Map([
        ["node_a", { solvedCount: 2 }],
        ["node_b", { solvedCount: 2 }],
      ]);
      const evalFull = evaluateSkillTree(multiPrereqNodes, fullProgress);
      expect(evalFull.find((n) => n.id === "node_c")?.isUnlocked).toBe(true);
    });
  });

  describe("checkCycle: DAG Cycle Detection", () => {
    it("returns false for valid acyclic DAGs", () => {
      expect(checkCycle(mockNodes)).toBe(false);
      expect(checkCycle(CANONICAL_SKILL_NODES)).toBe(false);
    });

    it("detects direct 2-node cycles (A -> B -> A)", () => {
      const cyclicNodes: SkillNode[] = [
        {
          id: "node_a",
          topicName: "Node A",
          description: "A",
          icon: "A",
          prerequisites: ["node_b"],
          requiredSolves: 1,
        },
        {
          id: "node_b",
          topicName: "Node B",
          description: "B",
          icon: "B",
          prerequisites: ["node_a"],
          requiredSolves: 1,
        },
      ];
      expect(checkCycle(cyclicNodes)).toBe(true);
    });

    it("detects indirect multi-node cycles (A -> B -> C -> A)", () => {
      const cyclicNodes: SkillNode[] = [
        {
          id: "node_a",
          topicName: "Node A",
          description: "A",
          icon: "A",
          prerequisites: ["node_c"],
          requiredSolves: 1,
        },
        {
          id: "node_b",
          topicName: "Node B",
          description: "B",
          icon: "B",
          prerequisites: ["node_a"],
          requiredSolves: 1,
        },
        {
          id: "node_c",
          topicName: "Node C",
          description: "C",
          icon: "C",
          prerequisites: ["node_b"],
          requiredSolves: 1,
        },
      ];
      expect(checkCycle(cyclicNodes)).toBe(true);
    });

    it("prevents infinite loops in evaluateSkillTree when a cycle is present", () => {
      const cyclicNodes: SkillNode[] = [
        {
          id: "node_a",
          topicName: "Node A",
          description: "A",
          icon: "A",
          prerequisites: ["node_b"],
          requiredSolves: 1,
        },
        {
          id: "node_b",
          topicName: "Node B",
          description: "B",
          icon: "B",
          prerequisites: ["node_a"],
          requiredSolves: 1,
        },
      ];
      // Should either throw or evaluate safely without hanging
      expect(() => {
        const result = evaluateSkillTree(cyclicNodes, new Map());
        // In a cycle with no root nodes, none can unlock
        for (const n of result) {
          expect(n.isUnlocked).toBe(false);
        }
      }).not.toThrow();
    });
  });

  describe("calculateTopicMastery & Mastery Clamping", () => {
    it("calculates percentage accurately", () => {
      expect(calculateTopicMastery(2, 4)).toBe(50);
      expect(calculateTopicMastery(1, 3)).toBe(33);
      expect(calculateTopicMastery(3, 3)).toBe(100);
    });

    it("clamps mastery score to range [0, 100]", () => {
      expect(calculateTopicMastery(0, 5)).toBe(0);
      expect(calculateTopicMastery(10, 5)).toBe(100); // More solved than total clamped to 100
      expect(calculateTopicMastery(-1, 5)).toBe(0);
    });

    it("handles totalProblems <= 0 gracefully returning 0", () => {
      expect(calculateTopicMastery(3, 0)).toBe(0);
    });
  });

  describe("calculateRadarMastery: Overall Radar Aggregation", () => {
    it("returns array of radar category masteries with 6+ DSA dimensions", () => {
      const solved = new Set<string>();
      const radar = calculateRadarMastery(solved);

      expect(Array.isArray(radar)).toBe(true);
      expect(radar.length).toBeGreaterThanOrEqual(6);

      const categoryNames = radar.map((r) => r.category);
      expect(categoryNames).toContain("Arrays & Hashing");
      expect(categoryNames).toContain("Two Pointers");
      expect(categoryNames).toContain("Linked List");
      expect(categoryNames).toContain("Trees");
      expect(categoryNames).toContain("Dynamic Programming");
      expect(categoryNames).toContain("Graphs");

      for (const item of radar) {
        expect(typeof item.category).toBe("string");
        expect(typeof item.score).toBe("number");
        expect(typeof item.solvedCount).toBe("number");
        expect(typeof item.totalCount).toBe("number");
        expect(item.score).toBeGreaterThanOrEqual(0);
        expect(item.score).toBeLessThanOrEqual(100);
        expect(item.solvedCount).toBe(0);
      }
    });

    it("increases solvedCount and score when matching problems are in solved set", () => {
      const solved = new Set<string>(["two-sum", "reverse-linked-list"]);
      const radar = calculateRadarMastery(solved);

      const arraysCategory = radar.find((r) => r.category === "Arrays & Hashing");
      expect(arraysCategory).toBeDefined();
      expect(arraysCategory!.solvedCount).toBeGreaterThanOrEqual(1);
      expect(arraysCategory!.score).toBeGreaterThan(0);

      const listCategory = radar.find((r) => r.category === "Linked List");
      expect(listCategory).toBeDefined();
      expect(listCategory!.solvedCount).toBeGreaterThanOrEqual(1);
      expect(listCategory!.score).toBeGreaterThan(0);
    });
  });

  describe("Canonical Skill Nodes Definition", () => {
    it("contains all 9 canonical DSA topics", () => {
      const ids = CANONICAL_SKILL_NODES.map((n) => n.id);
      expect(ids).toContain("arrays_hashing");
      expect(ids).toContain("two_pointers");
      expect(ids).toContain("sliding_window");
      expect(ids).toContain("linked_list");
      expect(ids).toContain("trees");
      expect(ids).toContain("dp_1d");
      expect(ids).toContain("binary_search");
      expect(ids).toContain("graphs");
      expect(ids).toContain("heap");
      expect(CANONICAL_SKILL_NODES.length).toBe(9);
    });

    it("is an acyclic graph", () => {
      expect(checkCycle(CANONICAL_SKILL_NODES)).toBe(false);
    });
  });
});
