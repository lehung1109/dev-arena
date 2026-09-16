/**
 * Skill Graph DAG Engine & Curriculum Mastery
 * Dev Arena - 001-in-browser-code-arena
 */

export interface SkillNode {
  id: string;
  topicName: string;
  description: string;
  icon: string;
  prerequisites: string[];
  requiredSolves: number;
  orderIndex?: number;
  totalProblems?: number;
}

export interface EvaluatedSkillNode extends SkillNode {
  solvedCount: number;
  isUnlocked: boolean;
  masteryScore: number;
}

export interface SkillCategoryMastery {
  category: string;
  score: number;
  solvedCount: number;
  totalCount: number;
}

/**
 * 9 Canonical DSA Skill Nodes forming a Directed Acyclic Graph (DAG)
 */
export const CANONICAL_SKILL_NODES: SkillNode[] = [
  {
    id: "arrays_hashing",
    topicName: "Arrays & Hashing",
    description: "Core contiguous memory, hash maps, frequency counters, and prefix sums.",
    icon: "Layers",
    prerequisites: [],
    requiredSolves: 2,
    orderIndex: 0,
    totalProblems: 4,
  },
  {
    id: "two_pointers",
    topicName: "Two Pointers",
    description: "Bidirectional and directional pointer iteration over ordered sequences.",
    icon: "Split",
    prerequisites: ["arrays_hashing"],
    requiredSolves: 2,
    orderIndex: 1,
    totalProblems: 3,
  },
  {
    id: "binary_search",
    topicName: "Binary Search",
    description: "Logarithmic divide-and-conquer search space reduction on monotonic bounds.",
    icon: "Search",
    prerequisites: ["arrays_hashing"],
    requiredSolves: 2,
    orderIndex: 2,
    totalProblems: 3,
  },
  {
    id: "sliding_window",
    topicName: "Sliding Window",
    description: "Dynamic and fixed-width contiguous window bounds for subarray optimization.",
    icon: "Maximize",
    prerequisites: ["two_pointers"],
    requiredSolves: 2,
    orderIndex: 3,
    totalProblems: 3,
  },
  {
    id: "linked_list",
    topicName: "Linked List",
    description: "Node reference traversal, pointer manipulation, cycle detection, and list reversal.",
    icon: "GitCommit",
    prerequisites: ["arrays_hashing"],
    requiredSolves: 2,
    orderIndex: 4,
    totalProblems: 3,
  },
  {
    id: "trees",
    topicName: "Trees",
    description: "Hierarchical recursive structures, BFS/DFS traversal, tree validation, and BST operations.",
    icon: "GitFork",
    prerequisites: ["linked_list"],
    requiredSolves: 2,
    orderIndex: 5,
    totalProblems: 3,
  },
  {
    id: "dp_1d",
    topicName: "1D Dynamic Programming",
    description: "Optimal substructure, memoization, state transitions, and bottom-up tabulation.",
    icon: "TrendingUp",
    prerequisites: ["arrays_hashing"],
    requiredSolves: 2,
    orderIndex: 6,
    totalProblems: 3,
  },
  {
    id: "heap",
    topicName: "Heap",
    description: "Priority queue data structures, top-K element extraction, and min/max heap invariants.",
    icon: "Boxes",
    prerequisites: ["trees"],
    requiredSolves: 2,
    orderIndex: 7,
    totalProblems: 3,
  },
  {
    id: "graphs",
    topicName: "Graphs",
    description: "Adjacency representations, BFS/DFS graph traversals, topological sort, and shortest paths.",
    icon: "Network",
    prerequisites: ["trees"],
    requiredSolves: 2,
    orderIndex: 8,
    totalProblems: 3,
  },
];

/**
 * Checks whether a given list of SkillNodes contains a cycle.
 * Uses 3-color DFS traversal (0 = unvisited, 1 = visiting, 2 = visited).
 */
export function checkCycle(nodes: SkillNode[]): boolean {
  const nodeMap = new Map<string, SkillNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // 0 = unvisited, 1 = visiting (in recursion stack), 2 = visited
  const visited = new Map<string, number>();

  function hasCycleDFS(nodeId: string): boolean {
    const state = visited.get(nodeId) ?? 0;
    if (state === 1) return true; // Cycle detected
    if (state === 2) return false;

    visited.set(nodeId, 1);

    const node = nodeMap.get(nodeId);
    if (node) {
      for (const prereqId of node.prerequisites) {
        if (hasCycleDFS(prereqId)) {
          return true;
        }
      }
    }

    visited.set(nodeId, 2);
    return false;
  }

  for (const node of nodes) {
    if ((visited.get(node.id) ?? 0) === 0) {
      if (hasCycleDFS(node.id)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculates topic mastery clamped between 0 and 100%.
 */
export function calculateTopicMastery(solvedCount: number, totalProblems: number): number {
  if (totalProblems <= 0) return 0;
  const pct = Math.round((solvedCount / totalProblems) * 100);
  return Math.max(0, Math.min(100, pct));
}

/**
 * Evaluates unlock conditions and mastery scores across the skill graph DAG.
 * Root nodes (no prerequisites) are always unlocked.
 * Dependent nodes unlock if and only if all prerequisite nodes are unlocked
 * and have achieved solvedCount >= prerequisiteNode.requiredSolves.
 */
export function evaluateSkillTree(
  nodes: SkillNode[],
  userProgress: Map<string, { solvedCount: number }> | Record<string, { solvedCount: number }>
): EvaluatedSkillNode[] {
  const nodeMap = new Map<string, SkillNode>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
  }

  const getSolved = (nodeId: string): number => {
    if (userProgress instanceof Map) {
      return userProgress.get(nodeId)?.solvedCount ?? 0;
    }
    return userProgress[nodeId]?.solvedCount ?? 0;
  };

  // Track unlock state
  const unlockMap = new Map<string, boolean>();

  // Initialize: root nodes are unlocked, others locked
  for (const node of nodes) {
    if (node.prerequisites.length === 0) {
      unlockMap.set(node.id, true);
    } else {
      unlockMap.set(node.id, false);
    }
  }

  // Multi-pass fixed-point resolution to propagate unlock states down the DAG
  let changed = true;
  let iterations = 0;
  const maxIterations = nodes.length + 1;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    for (const node of nodes) {
      if (unlockMap.get(node.id)) continue;

      // Check if all prerequisites are unlocked and have met their required solves
      const allPrereqsMet = node.prerequisites.every((prereqId) => {
        const prereqNode = nodeMap.get(prereqId);
        if (!prereqNode) return false;
        const prereqUnlocked = unlockMap.get(prereqId) ?? false;
        const prereqSolved = getSolved(prereqId);
        return prereqUnlocked && prereqSolved >= prereqNode.requiredSolves;
      });

      if (allPrereqsMet) {
        unlockMap.set(node.id, true);
        changed = true;
      }
    }
  }

  return nodes.map((node) => {
    const solvedCount = getSolved(node.id);
    const total = node.totalProblems ?? Math.max(1, node.requiredSolves);
    const masteryScore = calculateTopicMastery(solvedCount, total);
    const isUnlocked = unlockMap.get(node.id) ?? false;

    return {
      ...node,
      solvedCount,
      isUnlocked,
      masteryScore,
    };
  });
}

/**
 * Problem definitions mapped to radar categories
 */
export const RADAR_TOPIC_PROBLEMS: Record<string, string[]> = {
  "Arrays & Hashing": ["two-sum", "contains-duplicate", "valid-anagram", "maximum-subarray"],
  "Two Pointers": ["valid-palindrome", "two-sum-ii", "container-with-most-water"],
  "Linked List": ["reverse-linked-list", "merge-two-sorted-lists", "linked-list-cycle"],
  "Trees": ["invert-binary-tree", "maximum-depth-of-binary-tree", "same-tree"],
  "Dynamic Programming": ["maximum-subarray", "climbing-stairs", "coin-change"],
  "Graphs": ["number-of-islands", "clone-graph", "course-schedule"],
};

/**
 * Calculates aggregated mastery metrics across 6 core DSA dimensions for the Radar chart.
 */
export function calculateRadarMastery(
  solvedProblemIds: Set<string> | string[]
): SkillCategoryMastery[] {
  const solvedSet = solvedProblemIds instanceof Set ? solvedProblemIds : new Set(solvedProblemIds);

  const categories = Object.keys(RADAR_TOPIC_PROBLEMS);

  return categories.map((category) => {
    const problemSlugs = RADAR_TOPIC_PROBLEMS[category] || [];
    const totalCount = problemSlugs.length;

    let solvedCount = 0;
    for (const slug of problemSlugs) {
      if (
        solvedSet.has(slug) ||
        solvedSet.has(`seed-${slug}`) ||
        Array.from(solvedSet).some((s) => s.includes(slug))
      ) {
        solvedCount++;
      }
    }

    const score = calculateTopicMastery(solvedCount, totalCount);

    return {
      category,
      score,
      solvedCount,
      totalCount,
    };
  });
}
