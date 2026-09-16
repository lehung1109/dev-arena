import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { skillNodes, userSkillProgress } from "@/lib/db/schema";
import {
  CANONICAL_SKILL_NODES,
  evaluateSkillTree,
  type SkillNode,
} from "@/lib/curriculum/skill-graph";
import { getSolvedProblemIds } from "@/lib/db/submissions-store";

// Map problem slugs to skill node IDs
const PROBLEM_TO_SKILL_MAP: Record<string, string[]> = {
  "two-sum": ["arrays_hashing"],
  "valid-parentheses": ["arrays_hashing"],
  "reverse-linked-list": ["linked_list"],
  "maximum-subarray": ["arrays_hashing", "dp_1d"],
  "valid-palindrome": ["two_pointers"],
  "container-with-most-water": ["two_pointers"],
  "binary-search": ["binary_search"],
  "invert-binary-tree": ["trees"],
  "maximum-depth-of-binary-tree": ["trees"],
  "number-of-islands": ["graphs"],
  "clone-graph": ["graphs"],
  "coin-change": ["dp_1d"],
};

export async function GET(request?: Request) {
  try {
    let rawNodes: SkillNode[] = [...CANONICAL_SKILL_NODES];
    const progressMap = new Map<string, { solvedCount: number }>();

    // 1. Try fetching from database if available
    let dbNodesLoaded = false;
    try {
      if (
        process.env.DATABASE_URL &&
        !process.env.DATABASE_URL.includes("mock_pass")
      ) {
        const fetchedNodes = await db.select().from(skillNodes);
        if (fetchedNodes && fetchedNodes.length > 0) {
          rawNodes = fetchedNodes.map((n) => ({
            id: n.id,
            topicName: n.topicName,
            description: n.description,
            icon: n.icon,
            prerequisites: n.prerequisites || [],
            requiredSolves: n.requiredSolves,
            orderIndex: n.orderIndex,
          }));
          dbNodesLoaded = true;
        }

        const fetchedProgress = await db.select().from(userSkillProgress);
        for (const p of fetchedProgress) {
          progressMap.set(p.skillNodeId, { solvedCount: p.solvedCount });
        }
      }
    } catch {
      // Database connection error or mock environment: continue with in-memory fallback
    }

    // 2. Supplement with in-memory solved problems
    const solvedProblemIds = getSolvedProblemIds();
    for (const problemId of solvedProblemIds) {
      // Extract pure slug if prefixed with 'seed-'
      const cleanSlug = problemId.replace(/^seed-/, "");
      const matchedSkills = PROBLEM_TO_SKILL_MAP[cleanSlug] || [];
      for (const skillId of matchedSkills) {
        const existing = progressMap.get(skillId)?.solvedCount ?? 0;
        progressMap.set(skillId, { solvedCount: existing + 1 });
      }
    }

    // 3. Evaluate the skill tree DAG
    const evaluatedNodes = evaluateSkillTree(rawNodes, progressMap);

    return NextResponse.json({
      nodes: evaluatedNodes.map((node) => ({
        id: node.id,
        topicName: node.topicName,
        description: node.description,
        icon: node.icon,
        prerequisites: node.prerequisites,
        requiredSolves: node.requiredSolves,
        solvedCount: node.solvedCount,
        isUnlocked: node.isUnlocked,
        masteryScore: node.masteryScore,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch skill tree" },
      { status: 500 }
    );
  }
}
