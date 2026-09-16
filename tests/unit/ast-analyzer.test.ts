import { describe, it, expect } from "vitest";
import { analyzeAST } from "@/lib/analysis/ast-analyzer";

describe("AST Analysis Engine Unit Tests (TDD)", () => {
  describe("Loop depth detection", () => {
    it("detects 0 loops for constant time operations (O(1))", () => {
      const code = `
        function getFirst(arr) {
          return arr[0];
        }
      `;
      const metrics = analyzeAST(code);
      expect(metrics.syntaxValid).toBe(true);
      expect(metrics.maxLoopDepth).toBe(0);
      expect(metrics.hasRecursion).toBe(false);
      expect(metrics.syntaxErrors).toHaveLength(0);
    });

    it("detects single loop (depth 1, O(N)) for standard for loop", () => {
      const code = `
        function findMax(nums) {
          let max = nums[0];
          for (let i = 1; i < nums.length; i++) {
            if (nums[i] > max) {
              max = nums[i];
            }
          }
          return max;
        }
      `;
      const metrics = analyzeAST(code);
      expect(metrics.syntaxValid).toBe(true);
      expect(metrics.maxLoopDepth).toBe(1);
      expect(metrics.hasRecursion).toBe(false);
    });

    it("detects single loop (depth 1) for sibling loops", () => {
      const code = `
        function countAndSum(nums) {
          let sum = 0;
          for (let i = 0; i < nums.length; i++) {
            sum += nums[i];
          }
          for (let j = 0; j < nums.length; j++) {
            console.log(nums[j]);
          }
          return sum;
        }
      `;
      const metrics = analyzeAST(code);
      expect(metrics.maxLoopDepth).toBe(1);
    });

    it("detects nested loops: For inside For (depth 2, O(N^2))", () => {
      const code = `
        function bubbleSort(arr) {
          for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr.length - 1; j++) {
              if (arr[j] > arr[j + 1]) {
                const temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
              }
            }
          }
          return arr;
        }
      `;
      const metrics = analyzeAST(code);
      expect(metrics.maxLoopDepth).toBe(2);
      expect(
        metrics.structuralWarnings.some((w) => /depth 2|O\(N\^2\)/i.test(w))
      ).toBe(true);
    });

    it("detects nested loops: While inside For (depth 2, O(N^2))", () => {
      const code = `
        function insertionSort(arr) {
          for (let i = 1; i < arr.length; i++) {
            let key = arr[i];
            let j = i - 1;
            while (j >= 0 && arr[j] > key) {
              arr[j + 1] = arr[j];
              j = j - 1;
            }
            arr[j + 1] = key;
          }
          return arr;
        }
      `;
      const metrics = analyzeAST(code);
      expect(metrics.maxLoopDepth).toBe(2);
      expect(
        metrics.structuralWarnings.some((w) => /depth 2|O\(N\^2\)/i.test(w))
      ).toBe(true);
    });

    it("detects nested loops: ForOf inside ForEach (depth 2, O(N^2))", () => {
      const code = `
        function processMatrix(matrix) {
          matrix.forEach((row) => {
            for (const item of row) {
              console.log(item);
            }
          });
        }
      `;
      const metrics = analyzeAST(code);
      expect(metrics.maxLoopDepth).toBe(2);
      expect(
        metrics.structuralWarnings.some((w) => /depth 2|O\(N\^2\)/i.test(w))
      ).toBe(true);
    });

    it("detects triple nested loops (depth 3, O(N^3))", () => {
      const code = `
        function threeSumBruteForce(nums) {
          const n = nums.length;
          for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
              for (let k = j + 1; k < n; k++) {
                if (nums[i] + nums[j] + nums[k] === 0) {
                  return [nums[i], nums[j], nums[k]];
                }
              }
            }
          }
          return [];
        }
      `;
      const metrics = analyzeAST(code);
      expect(metrics.maxLoopDepth).toBe(3);
      expect(
        metrics.structuralWarnings.some((w) => /depth 3|O\(N\^3\)/i.test(w))
      ).toBe(true);
    });
  });

  describe("Recursion detection", () => {
    it("detects recursive function declaration calling itself", () => {
      const code = `
        function fibonacci(n) {
          if (n <= 1) return n;
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
      `;
      const metrics = analyzeAST(code);
      expect(metrics.hasRecursion).toBe(true);
      expect(
        metrics.structuralWarnings.some((w) => /recurs/i.test(w))
      ).toBe(true);
    });

    it("detects recursive arrow function calling itself via variable name", () => {
      const code = `
        const countdown = (n) => {
          if (n <= 0) return 0;
          return countdown(n - 1);
        };
      `;
      const metrics = analyzeAST(code);
      expect(metrics.hasRecursion).toBe(true);
      expect(
        metrics.structuralWarnings.some((w) => /recurs/i.test(w))
      ).toBe(true);
    });

    it("does not flag non-recursive helper function calls as recursion", () => {
      const code = `
        function helper(x) {
          return x * 2;
        }
        function main(arr) {
          return arr.map(helper);
        }
      `;
      const metrics = analyzeAST(code);
      expect(metrics.hasRecursion).toBe(false);
    });
  });

  describe("Syntax error handling and location extraction", () => {
    it("captures SyntaxErrors with accurate line and column numbers", () => {
      const code = `function broken(a, b) {\n  return a + \n}`;
      const metrics = analyzeAST(code);
      expect(metrics.syntaxValid).toBe(false);
      expect(metrics.syntaxErrors.length).toBeGreaterThanOrEqual(1);
      const err = metrics.syntaxErrors[0];
      expect(err.line).toBeGreaterThanOrEqual(2);
      expect(typeof err.column).toBe("number");
      expect(err.message).toBeDefined();
      expect(metrics.structuralWarnings.length).toBeGreaterThanOrEqual(1);
    });

    it("handles TypeScript syntax annotations cleanly", () => {
      const code = `
        function typedSum(nums: number[]): number {
          let total: number = 0;
          for (const n of nums) {
            total += n;
          }
          return total;
        }
      `;
      const metrics = analyzeAST(code);
      expect(metrics.syntaxValid).toBe(true);
      expect(metrics.maxLoopDepth).toBe(1);
    });
  });
});
