/**
 * Curriculum Problems Catalog
 * Comprehensive DSA challenge repository for Dev Arena library and skill tree
 */

import { SEED_PROBLEMS } from "@/lib/db/seeds/seed-problems";

export interface CatalogProblem {
  slug: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topicTags: string[];
  acceptanceRate: string;
  description: string;
  starterCode: string;
  functionName: string;
  hints: string[];
  testCases: Array<{
    input: unknown[];
    expectedOutput: unknown;
    isPublic: boolean;
    orderIndex: number;
    explanation?: string;
  }>;
  benchmarkCases: Array<{
    inputSize: number;
    inputPayload: unknown[];
  }>;
}

export const EXTENDED_CATALOG_PROBLEMS: CatalogProblem[] = [
  {
    slug: "valid-palindrome",
    title: "Valid Palindrome",
    difficulty: "EASY",
    topicTags: ["Two Pointers", "String"],
    acceptanceRate: "46.2%",
    functionName: "isPalindrome",
    description: `A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string \`s\`, return \`true\` *if it is a palindrome, or \`false\` otherwise*.

### Example 1:
\`\`\`text
Input: s = "A man, a plan, a canal: Panama"
Output: true
Explanation: "amanaplanacanalpanama" is a palindrome.
\`\`\`

### Example 2:
\`\`\`text
Input: s = "race a car"
Output: false
Explanation: "raceacar" is not a palindrome.
\`\`\``,
    starterCode: `/**
 * @param {string} s
 * @return {boolean}
 */
function isPalindrome(s) {
  // Your code here
}
`,
    hints: [
      "Consider using two pointers: one starting from the beginning and one from the end.",
      "Filter or skip non-alphanumeric characters as you iterate inward.",
    ],
    testCases: [
      {
        input: ["A man, a plan, a canal: Panama"],
        expectedOutput: true,
        isPublic: true,
        orderIndex: 0,
        explanation: "Matches palindrome after normalization.",
      },
      {
        input: ["race a car"],
        expectedOutput: false,
        isPublic: true,
        orderIndex: 1,
        explanation: "Fails character symmetry.",
      },
      {
        input: [" "],
        expectedOutput: true,
        isPublic: true,
        orderIndex: 2,
        explanation: "Empty or space-only string is considered a valid palindrome.",
      },
    ],
    benchmarkCases: [
      { inputSize: 10, inputPayload: ["a".repeat(10)] },
      { inputSize: 100, inputPayload: ["a".repeat(100)] },
      { inputSize: 1000, inputPayload: ["a".repeat(1000)] },
    ],
  },
  {
    slug: "container-with-most-water",
    title: "Container With Most Water",
    difficulty: "MEDIUM",
    topicTags: ["Two Pointers", "Arrays", "Greedy"],
    acceptanceRate: "54.8%",
    functionName: "maxArea",
    description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i-th\` line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water. Return *the maximum amount of water a container can store*.

### Example 1:
\`\`\`text
Input: height = [1,8,6,2,5,4,8,3,7]
Output: 49
Explanation: The vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water is 49.
\`\`\``,
    starterCode: `/**
 * @param {number[]} height
 * @return {number}
 */
function maxArea(height) {
  // Your code here
}
`,
    hints: [
      "The capacity is limited by the shorter line: (right - left) * min(height[left], height[right]).",
      "Move the pointer pointing to the shorter vertical line inward to potentially find a taller line.",
    ],
    testCases: [
      {
        input: [[1, 8, 6, 2, 5, 4, 8, 3, 7]],
        expectedOutput: 49,
        isPublic: true,
        orderIndex: 0,
      },
      {
        input: [[1, 1]],
        expectedOutput: 1,
        isPublic: true,
        orderIndex: 1,
      },
    ],
    benchmarkCases: [
      { inputSize: 10, inputPayload: [Array.from({ length: 10 }, (_, i) => i + 1)] },
      { inputSize: 100, inputPayload: [Array.from({ length: 100 }, (_, i) => i + 1)] },
    ],
  },
  {
    slug: "binary-search",
    title: "Binary Search",
    difficulty: "EASY",
    topicTags: ["Binary Search", "Arrays"],
    acceptanceRate: "57.3%",
    functionName: "search",
    description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with \`O(log n)\` runtime complexity.

### Example 1:
\`\`\`text
Input: nums = [-1,0,3,5,9,12], target = 9
Output: 4
Explanation: 9 exists in nums and its index is 4
\`\`\``,
    starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
function search(nums, target) {
  // Your code here
}
`,
    hints: [
      "Maintain low and high pointers, compute the mid point: mid = Math.floor((low + high) / 2).",
      "If nums[mid] == target, return mid. If nums[mid] < target, search right half, else search left half.",
    ],
    testCases: [
      {
        input: [[-1, 0, 3, 5, 9, 12], 9],
        expectedOutput: 4,
        isPublic: true,
        orderIndex: 0,
      },
      {
        input: [[-1, 0, 3, 5, 9, 12], 2],
        expectedOutput: -1,
        isPublic: true,
        orderIndex: 1,
      },
    ],
    benchmarkCases: [
      { inputSize: 10, inputPayload: [Array.from({ length: 10 }, (_, i) => i * 2), 6] },
      { inputSize: 100, inputPayload: [Array.from({ length: 100 }, (_, i) => i * 2), 64] },
    ],
  },
  {
    slug: "invert-binary-tree",
    title: "Invert Binary Tree",
    difficulty: "EASY",
    topicTags: ["Trees", "Binary Search Trees", "DFS"],
    acceptanceRate: "76.4%",
    functionName: "invertTree",
    description: `Given the \`root\` of a binary tree (represented in level order array), invert the tree, and return *its root*.

### Example 1:
\`\`\`text
Input: root = [4,2,7,1,3,6,9]
Output: [4,7,2,9,6,3,1]
\`\`\``,
    starterCode: `/**
 * @param {any} root
 * @return {any}
 */
function invertTree(root) {
  // Your code here
}
`,
    hints: [
      "Recursively invert the left subtree and right subtree, then swap them.",
    ],
    testCases: [
      {
        input: [[4, 2, 7, 1, 3, 6, 9]],
        expectedOutput: [4, 7, 2, 9, 6, 3, 1],
        isPublic: true,
        orderIndex: 0,
      },
      {
        input: [[2, 1, 3]],
        expectedOutput: [2, 3, 1],
        isPublic: true,
        orderIndex: 1,
      },
      {
        input: [[]],
        expectedOutput: [],
        isPublic: true,
        orderIndex: 2,
      },
    ],
    benchmarkCases: [
      { inputSize: 7, inputPayload: [[4, 2, 7, 1, 3, 6, 9]] },
    ],
  },
  {
    slug: "climbing-stairs",
    title: "Climbing Stairs",
    difficulty: "EASY",
    topicTags: ["Dynamic Programming", "1D Dynamic Programming", "Math"],
    acceptanceRate: "52.8%",
    functionName: "climbStairs",
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?

### Example 1:
\`\`\`text
Input: n = 2
Output: 2
Explanation: There are two ways to climb to the top: 1 step + 1 step, or 2 steps.
\`\`\`

### Example 2:
\`\`\`text
Input: n = 3
Output: 3
Explanation: 1+1+1, 1+2, 2+1.
\`\`\``,
    starterCode: `/**
 * @param {number} n
 * @return {number}
 */
function climbStairs(n) {
  // Your code here
}
`,
    hints: [
      "To reach step n, you can either take 1 step from (n-1) or 2 steps from (n-2).",
      "This is equivalent to the Fibonacci sequence: dp[i] = dp[i-1] + dp[i-2].",
    ],
    testCases: [
      { input: [2], expectedOutput: 2, isPublic: true, orderIndex: 0 },
      { input: [3], expectedOutput: 3, isPublic: true, orderIndex: 1 },
      { input: [4], expectedOutput: 5, isPublic: true, orderIndex: 2 },
      { input: [5], expectedOutput: 8, isPublic: false, orderIndex: 3 },
    ],
    benchmarkCases: [
      { inputSize: 10, inputPayload: [10] },
      { inputSize: 20, inputPayload: [20] },
    ],
  },
  {
    slug: "number-of-islands",
    title: "Number of Islands",
    difficulty: "MEDIUM",
    topicTags: ["Graphs", "BFS/DFS", "Matrix"],
    acceptanceRate: "58.1%",
    functionName: "numIslands",
    description: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return *the number of islands*.

An **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.

### Example 1:
\`\`\`text
Input: grid = [
  ["1","1","1","1","0"],
  ["1","1","0","1","0"],
  ["1","1","0","0","0"],
  ["0","0","0","0","0"]
]
Output: 1
\`\`\``,
    starterCode: `/**
 * @param {string[][]} grid
 * @return {number}
 */
function numIslands(grid) {
  // Your code here
}
`,
    hints: [
      "Iterate over every cell in the grid. When you find a '1', increment island count and trigger a BFS/DFS to sink the island (mark visited cells as '0').",
    ],
    testCases: [
      {
        input: [
          [
            ["1", "1", "1", "1", "0"],
            ["1", "1", "0", "1", "0"],
            ["1", "1", "0", "0", "0"],
            ["0", "0", "0", "0", "0"],
          ],
        ],
        expectedOutput: 1,
        isPublic: true,
        orderIndex: 0,
      },
      {
        input: [
          [
            ["1", "1", "0", "0", "0"],
            ["1", "1", "0", "0", "0"],
            ["0", "0", "1", "0", "0"],
            ["0", "0", "0", "1", "1"],
          ],
        ],
        expectedOutput: 3,
        isPublic: true,
        orderIndex: 1,
      },
    ],
    benchmarkCases: [
      {
        inputSize: 4,
        inputPayload: [
          [
            ["1", "0", "1", "0"],
            ["0", "1", "0", "1"],
            ["1", "0", "1", "0"],
            ["0", "1", "0", "1"],
          ],
        ],
      },
    ],
  },
  {
    slug: "kth-largest-element-in-an-array",
    title: "Kth Largest Element in an Array",
    difficulty: "MEDIUM",
    topicTags: ["Heap", "Arrays", "Divide & Conquer"],
    acceptanceRate: "66.9%",
    functionName: "findKthLargest",
    description: `Given an integer array \`nums\` and an integer \`k\`, return *the \`k-th\` largest element in the array*.

Note that it is the \`k-th\` largest element in the sorted order, not the \`k-th\` distinct element.

### Example 1:
\`\`\`text
Input: nums = [3,2,1,5,6,4], k = 2
Output: 5
\`\`\``,
    starterCode: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
function findKthLargest(nums, k) {
  // Your code here
}
`,
    hints: [
      "You can sort the array descending and return nums[k-1], or use a Min-Heap of size k.",
    ],
    testCases: [
      {
        input: [[3, 2, 1, 5, 6, 4], 2],
        expectedOutput: 5,
        isPublic: true,
        orderIndex: 0,
      },
      {
        input: [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4],
        expectedOutput: 4,
        isPublic: true,
        orderIndex: 1,
      },
    ],
    benchmarkCases: [
      { inputSize: 6, inputPayload: [[3, 2, 1, 5, 6, 4], 2] },
    ],
  },
];

const SEED_ACCEPTANCE_RATES: Record<string, string> = {
  "two-sum": "51.4%",
  "valid-parentheses": "41.2%",
  "reverse-linked-list": "75.1%",
  "maximum-subarray": "50.8%",
};

/**
 * Returns the unified problem catalog combining foundational SEED_PROBLEMS
 * and extended curriculum problems.
 */
export function getAllCatalogProblems(): CatalogProblem[] {
  const seedAdapted: CatalogProblem[] = SEED_PROBLEMS.map((p) => ({
    slug: p.slug,
    title: p.title,
    difficulty: p.difficulty,
    topicTags: p.topicTags,
    acceptanceRate: SEED_ACCEPTANCE_RATES[p.slug] || "50.0%",
    description: p.description,
    starterCode: p.starterCode,
    functionName: p.functionName,
    hints: p.hints,
    testCases: p.testCases.map((tc) => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isPublic: tc.isPublic,
      orderIndex: tc.orderIndex,
      explanation: tc.explanation,
    })),
    benchmarkCases: p.benchmarkCases.map((bc) => ({
      inputSize: bc.inputSize,
      inputPayload: bc.inputPayload,
    })),
  }));

  return [...seedAdapted, ...EXTENDED_CATALOG_PROBLEMS];
}

export function findCatalogProblem(slug: string): CatalogProblem | undefined {
  return getAllCatalogProblems().find((p) => p.slug === slug);
}
