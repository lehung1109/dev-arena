import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  sanitizeAIOutput,
  generateSocraticHint,
  type HintTier,
} from "@/lib/ai/socratic-tutor";

describe("Socratic AI Tutor Engine Unit Tests (TDD)", () => {
  describe("buildSystemPrompt", () => {
    it("creates distinct guidance instructions for Level 1 (Conceptual Nudge)", () => {
      const prompt = buildSystemPrompt(1);
      expect(prompt).toContain("Level 1");
      expect(prompt.toLowerCase()).toMatch(/conceptual|nudge|diagnostic|question|edge.case/i);
      expect(prompt).toMatch(/DO NOT provide code|NEVER provide code|prohibit/i);
    });

    it("creates distinct guidance instructions for Level 2 (Algorithmic Pattern)", () => {
      const prompt = buildSystemPrompt(2);
      expect(prompt).toContain("Level 2");
      expect(prompt.toLowerCase()).toMatch(/algorithm|pattern|data structure|paradigm/i);
      expect(prompt).toMatch(/DO NOT provide code|NEVER provide code|prohibit/i);
    });

    it("creates distinct guidance instructions for Level 3 (Pseudocode Flow)", () => {
      const prompt = buildSystemPrompt(3);
      expect(prompt).toContain("Level 3");
      expect(prompt.toLowerCase()).toMatch(/pseudocode|flow|steps|logical/i);
      expect(prompt).toMatch(/DO NOT provide code|NEVER provide code|prohibit/i);
    });
  });

  describe("sanitizeAIOutput - Anti-Spoiler Guardrail Filter", () => {
    it("strips markdown code blocks with language identifiers (e.g., ```javascript, ```ts)", () => {
      const spoilerInput = `Here is how you solve it:
\`\`\`javascript
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff), i];
    map.set(nums[i], i);
  }
}
\`\`\`
Think about using a Map instead.`;

      const sanitized = sanitizeAIOutput(spoilerInput);
      expect(sanitized).not.toContain("```javascript");
      expect(sanitized).not.toContain("function twoSum(nums, target)");
      expect(sanitized).not.toContain("if (map.has(diff)) return [map.get(diff), i]");
      expect(sanitized).toMatch(/code (hidden|redacted|removed)|focus on the conceptual flow|pedagogical/i);
      expect(sanitized).toContain("Think about using a Map instead.");
    });

    it("detects and redacts direct solution function statements and return syntax", () => {
      const rawSolutionSnippet = `You can write: function solve(arr) { return [i, j]; } to finish it.`;
      const sanitized = sanitizeAIOutput(rawSolutionSnippet);

      expect(sanitized).not.toContain("function solve(arr)");
      expect(sanitized).not.toContain("return [i, j]");
    });

    it("preserves pure pedagogical conversational guidance and markdown formatting", () => {
      const safeConversationalHint = `What happens if the input array contains negative numbers or is empty?
Consider whether you need to examine every pair or if you can remember visited numbers.
- Check edge cases first
- Think about what data structure offers constant-time lookups`;

      const sanitized = sanitizeAIOutput(safeConversationalHint);
      expect(sanitized).toBe(safeConversationalHint);
    });
  });

  describe("generateSocraticHint - Curated Pedagogical Engine (Offline / Fallback Mode)", () => {
    it("delivers Level 1 conceptual nudge for Two Sum without revealing solution code", async () => {
      const result = await generateSocraticHint({
        problemSlug: "two-sum",
        problemTitle: "Two Sum",
        userCode: "function twoSum(nums, target) {}",
        tier: 1,
      });

      expect(result.tier).toBe(1);
      expect(result.guidanceType).toBe("conceptual_nudge");
      expect(typeof result.hint).toBe("string");
      expect(result.hint.length).toBeGreaterThan(20);
      expect(result.hint).not.toMatch(/```[a-z]*[\s\S]*?```/);
      expect(result.hint).not.toContain("return [");
      expect(result.hint.toLowerCase()).toMatch(/complement|target|pair|sum|element/);
    });

    it("delivers Level 2 algorithmic pattern for Valid Parentheses", async () => {
      const result = await generateSocraticHint({
        problemSlug: "valid-parentheses",
        problemTitle: "Valid Parentheses",
        userCode: "function isValid(s) {}",
        tier: 2,
      });

      expect(result.tier).toBe(2);
      expect(result.guidanceType).toBe("algorithm_pattern");
      expect(result.hint.toLowerCase()).toMatch(/stack|lifo|last-in|push|match/);
      expect(result.hint).not.toMatch(/```[a-z]*[\s\S]*?```/);
    });

    it("delivers Level 3 pseudocode step-by-step breakdown for Reverse Linked List", async () => {
      const result = await generateSocraticHint({
        problemSlug: "reverse-linked-list",
        problemTitle: "Reverse Linked List",
        userCode: "function reverseList(head) {}",
        tier: 3,
      });

      expect(result.tier).toBe(3);
      expect(result.guidanceType).toBe("pseudocode_flow");
      expect(result.hint.toLowerCase()).toMatch(/step|pointer|prev|current|traverse/);
      expect(result.hint).not.toMatch(/```[a-z]*[\s\S]*?```/);
      expect(result.hint).not.toContain("current.next = prev");
    });

    it("tailors Socratic guidance when execution errorContext is supplied", async () => {
      const result = await generateSocraticHint({
        problemSlug: "two-sum",
        problemTitle: "Two Sum",
        userCode: "function twoSum(nums, target) { return nums[0]; }",
        tier: 1,
        errorContext: "Expected [0, 1] but received 2",
      });

      expect(result.hint.toLowerCase()).toMatch(/received|expected|indices|index|return/);
      expect(result.hint).not.toMatch(/```[a-z]*[\s\S]*?```/);
    });

    it("provides graceful pedagogical response for unseeded problems", async () => {
      const result = await generateSocraticHint({
        problemSlug: "custom-graph-problem",
        problemTitle: "Custom Graph Problem",
        tier: 1,
      });

      expect(result.tier).toBe(1);
      expect(result.guidanceType).toBe("conceptual_nudge");
      expect(result.hint.length).toBeGreaterThan(15);
    });
  });
});
