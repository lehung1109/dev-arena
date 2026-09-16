import { db } from "../client";
import { benchmarkCases, problems, skillNodes, testCases } from "../schema";

export const SEED_SKILL_NODES = [
  {
    id: "arrays_hashing",
    topicName: "Arrays & Hashing",
    description:
      "Core linear memory layout, hash sets, hash maps, frequency counters, and prefix sum patterns.",
    icon: "Layers",
    prerequisites: [],
    requiredSolves: 3,
    orderIndex: 0,
  },
  {
    id: "two_pointers",
    topicName: "Two Pointers",
    description:
      "Bidirectional and directional pointer iteration over ordered or indexed sequences.",
    icon: "Split",
    prerequisites: ["arrays_hashing"],
    requiredSolves: 3,
    orderIndex: 1,
  },
  {
    id: "sliding_window",
    topicName: "Sliding Window",
    description:
      "Dynamic and fixed-width contiguous window bounds for subarray and substring metrics.",
    icon: "Maximize",
    prerequisites: ["two_pointers"],
    requiredSolves: 3,
    orderIndex: 2,
  },
  {
    id: "linked_list",
    topicName: "Linked List",
    description:
      "Node reference traversal, pointer manipulation, cycle detection, and list reversal.",
    icon: "GitCommit",
    prerequisites: ["arrays_hashing"],
    requiredSolves: 3,
    orderIndex: 3,
  },
  {
    id: "trees",
    topicName: "Trees & Binary Search Trees",
    description:
      "Hierarchical recursive structures, BFS/DFS traversal, tree validation, and BST operations.",
    icon: "GitFork",
    prerequisites: ["linked_list"],
    requiredSolves: 3,
    orderIndex: 4,
  },
  {
    id: "dp_1d",
    topicName: "1-D Dynamic Programming",
    description:
      "Optimal substructure, overlapping subproblems, state transitions, memoization, and bottom-up tabulation.",
    icon: "TrendingUp",
    prerequisites: ["arrays_hashing"],
    requiredSolves: 3,
    orderIndex: 5,
  },
];

export const SEED_PROBLEMS = [
  {
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "EASY" as const,
    topicTags: ["Arrays", "Hash Table"],
    functionName: "twoSum",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.

### Example 1:
\`\`\`text
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\`

### Example 2:
\`\`\`text
Input: nums = [3,2,4], target = 6
Output: [1,2]
\`\`\`

### Constraints:
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- Exactly one valid answer exists.`,
    starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // Your code here
}
`,
    hints: [
      "Try using a hash map to store elements you have previously traversed.",
      "For each element nums[i], check whether (target - nums[i]) already exists in your map.",
    ],
    testCases: [
      {
        input: [[2, 7, 11, 15], 9],
        expectedOutput: [0, 1],
        isPublic: true,
        orderIndex: 0,
        explanation: "nums[0] + nums[1] == 9, so [0, 1] is returned.",
      },
      {
        input: [[3, 2, 4], 6],
        expectedOutput: [1, 2],
        isPublic: true,
        orderIndex: 1,
        explanation: "nums[1] + nums[2] == 6, so [1, 2] is returned.",
      },
      {
        input: [[3, 3], 6],
        expectedOutput: [0, 1],
        isPublic: true,
        orderIndex: 2,
        explanation: "nums[0] + nums[1] == 6, so [0, 1] is returned.",
      },
      {
        input: [[-1, -2, -3, -4, -5], -8],
        expectedOutput: [2, 4],
        isPublic: false,
        orderIndex: 3,
        explanation: "Negative values sum check.",
      },
      {
        input: [[0, 4, 3, 0], 0],
        expectedOutput: [0, 3],
        isPublic: false,
        orderIndex: 4,
        explanation: "Zero-sum edge case.",
      },
    ],
    benchmarkCases: [
      {
        inputSize: 10,
        inputPayload: [Array.from({ length: 10 }, (_, i) => i + 1), 19],
      },
      {
        inputSize: 100,
        inputPayload: [Array.from({ length: 100 }, (_, i) => i + 1), 199],
      },
      {
        inputSize: 1000,
        inputPayload: [Array.from({ length: 1000 }, (_, i) => i + 1), 1999],
      },
    ],
  },
  {
    slug: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "EASY" as const,
    topicTags: ["String", "Stack"],
    functionName: "isValid",
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

### Example 1:
\`\`\`text
Input: s = "()"
Output: true
\`\`\`

### Example 2:
\`\`\`text
Input: s = "()[]{}"
Output: true
\`\`\`

### Example 3:
\`\`\`text
Input: s = "(]"
Output: false
\`\`\``,
    starterCode: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  // Your code here
}
`,
    hints: [
      "Use a Stack to keep track of unclosed opening brackets.",
      "When a closing bracket is found, inspect whether the stack top matches.",
    ],
    testCases: [
      {
        input: ["()"],
        expectedOutput: true,
        isPublic: true,
        orderIndex: 0,
        explanation: "Single matching parenthesis pair.",
      },
      {
        input: ["()[]{}"],
        expectedOutput: true,
        isPublic: true,
        orderIndex: 1,
        explanation: "Multiple matching bracket pairs.",
      },
      {
        input: ["(]"],
        expectedOutput: false,
        isPublic: true,
        orderIndex: 2,
        explanation: "Mismatched bracket types.",
      },
      {
        input: ["([)]"],
        expectedOutput: false,
        isPublic: false,
        orderIndex: 3,
        explanation: "Interleaved invalid order.",
      },
      {
        input: ["{[]}"],
        expectedOutput: true,
        isPublic: false,
        orderIndex: 4,
        explanation: "Properly nested bracket pairs.",
      },
    ],
    benchmarkCases: [
      {
        inputSize: 10,
        inputPayload: ["()".repeat(5)],
      },
      {
        inputSize: 100,
        inputPayload: ["()".repeat(50)],
      },
      {
        inputSize: 1000,
        inputPayload: ["()".repeat(500)],
      },
    ],
  },
  {
    slug: "reverse-linked-list",
    title: "Reverse Linked List",
    difficulty: "EASY" as const,
    topicTags: ["Linked List"],
    functionName: "reverseList",
    description: `Given the \`head\` of a singly linked list (represented as an array of values), reverse the list, and return *the reversed list values*.

### Example 1:
\`\`\`text
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]
\`\`\`

### Example 2:
\`\`\`text
Input: head = [1,2]
Output: [2,1]
\`\`\`

### Example 3:
\`\`\`text
Input: head = []
Output: []
\`\`\``,
    starterCode: `/**
 * @param {number[]} head
 * @return {number[]}
 */
function reverseList(head) {
  // Your code here
}
`,
    hints: [
      "Iterate through the array from tail to head, or use pointers to swap elements in-place.",
    ],
    testCases: [
      {
        input: [[1, 2, 3, 4, 5]],
        expectedOutput: [5, 4, 3, 2, 1],
        isPublic: true,
        orderIndex: 0,
        explanation: "Reversed order of 5 elements.",
      },
      {
        input: [[1, 2]],
        expectedOutput: [2, 1],
        isPublic: true,
        orderIndex: 1,
        explanation: "Reversed order of 2 elements.",
      },
      {
        input: [[]],
        expectedOutput: [],
        isPublic: true,
        orderIndex: 2,
        explanation: "Empty list returns empty list.",
      },
      {
        input: [[42]],
        expectedOutput: [42],
        isPublic: false,
        orderIndex: 3,
        explanation: "Single element list.",
      },
    ],
    benchmarkCases: [
      {
        inputSize: 10,
        inputPayload: [Array.from({ length: 10 }, (_, i) => i)],
      },
      {
        inputSize: 100,
        inputPayload: [Array.from({ length: 100 }, (_, i) => i)],
      },
      {
        inputSize: 1000,
        inputPayload: [Array.from({ length: 1000 }, (_, i) => i)],
      },
    ],
  },
  {
    slug: "maximum-subarray",
    title: "Maximum Subarray",
    difficulty: "MEDIUM" as const,
    topicTags: ["Arrays", "Dynamic Programming"],
    functionName: "maxSubArray",
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return *its sum*.

### Example 1:
\`\`\`text
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum 6.
\`\`\`

### Example 2:
\`\`\`text
Input: nums = [1]
Output: 1
Explanation: The subarray [1] has the largest sum 1.
\`\`\`

### Example 3:
\`\`\`text
Input: nums = [5,4,-1,7,8]
Output: 23
Explanation: The subarray [5,4,-1,7,8] has the largest sum 23.
\`\`\``,
    starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function maxSubArray(nums) {
  // Your code here
}
`,
    hints: [
      "Kadane's algorithm computes the maximum subarray ending at each index in O(N) time.",
      "If the current running sum drops below zero, reset it to zero.",
    ],
    testCases: [
      {
        input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]],
        expectedOutput: 6,
        isPublic: true,
        orderIndex: 0,
        explanation: "The subarray [4, -1, 2, 1] has largest sum 6.",
      },
      {
        input: [[1]],
        expectedOutput: 1,
        isPublic: true,
        orderIndex: 1,
        explanation: "Single element array.",
      },
      {
        input: [[5, 4, -1, 7, 8]],
        expectedOutput: 23,
        isPublic: true,
        orderIndex: 2,
        explanation: "All positive sum.",
      },
      {
        input: [[-1, -2, -3]],
        expectedOutput: -1,
        isPublic: false,
        orderIndex: 3,
        explanation: "All negative numbers return the least negative.",
      },
    ],
    benchmarkCases: [
      {
        inputSize: 10,
        inputPayload: [Array.from({ length: 10 }, (_, i) => (i % 2 === 0 ? i : -i))],
      },
      {
        inputSize: 100,
        inputPayload: [Array.from({ length: 100 }, (_, i) => (i % 2 === 0 ? i : -i))],
      },
      {
        inputSize: 1000,
        inputPayload: [Array.from({ length: 1000 }, (_, i) => (i % 2 === 0 ? i : -i))],
      },
    ],
  },
];

export async function seed() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("mock")) {
    console.warn(
      "[seed-problems] DATABASE_URL is unset or using mock connection. Skipping remote DB write."
    );
    return {
      success: true,
      seededProblems: SEED_PROBLEMS.length,
      seededSkillNodes: SEED_SKILL_NODES.length,
    };
  }

  console.info("[seed-problems] Starting database seed...");

  // 1. Seed Skill Nodes
  for (const node of SEED_SKILL_NODES) {
    await db
      .insert(skillNodes)
      .values(node)
      .onConflictDoUpdate({
        target: skillNodes.id,
        set: {
          topicName: node.topicName,
          description: node.description,
          icon: node.icon,
          prerequisites: node.prerequisites,
          requiredSolves: node.requiredSolves,
          orderIndex: node.orderIndex,
        },
      });
  }

  // 2. Seed Problems & Cases
  for (const prob of SEED_PROBLEMS) {
    const { testCases: tests, benchmarkCases: benchmarks, ...problemData } = prob;

    const [insertedProblem] = await db
      .insert(problems)
      .values(problemData)
      .onConflictDoUpdate({
        target: problems.slug,
        set: {
          title: problemData.title,
          description: problemData.description,
          difficulty: problemData.difficulty,
          topicTags: problemData.topicTags,
          starterCode: problemData.starterCode,
          functionName: problemData.functionName,
          hints: problemData.hints,
        },
      })
      .returning();

    if (insertedProblem) {
      for (const tc of tests) {
        await db.insert(testCases).values({
          problemId: insertedProblem.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isPublic: tc.isPublic,
          orderIndex: tc.orderIndex,
          explanation: tc.explanation,
        });
      }

      for (const bc of benchmarks) {
        await db.insert(benchmarkCases).values({
          problemId: insertedProblem.id,
          inputSize: bc.inputSize,
          inputPayload: bc.inputPayload,
        });
      }
    }
  }

  console.info("[seed-problems] Seeding successfully completed.");
  return {
    success: true,
    seededProblems: SEED_PROBLEMS.length,
    seededSkillNodes: SEED_SKILL_NODES.length,
  };
}

// Auto-run if invoked directly
const isMainModule = Boolean(
  (import.meta as unknown as { main?: boolean }).main ||
    (typeof process !== "undefined" && process.argv[1]?.includes("seed-problems"))
);

if (isMainModule) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[seed-problems] Seed error:", err);
      process.exit(1);
    });
}

