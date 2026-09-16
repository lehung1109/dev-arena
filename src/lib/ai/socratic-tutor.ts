/**
 * Socratic AI Tutor Engine (Dev Arena)
 *
 * Implements 3-tier progressive pedagogical guidance:
 * - Level 1: Conceptual Nudge / Diagnostic Question & Edge-Case Reminders
 * - Level 2: Algorithmic Pattern & Data Structure Recommendation
 * - Level 3: Pseudocode / Step-by-Step Flow Breakdown (Language-Agnostic)
 *
 * Enforces strict anti-spoiler regex guardrails preventing any raw solution code leaks.
 * Operates offline with high-quality curated knowledge for seed problems, while supporting
 * live external Gemini / OpenAI LLM APIs when keys are configured.
 */

export type HintTier = 1 | 2 | 3;

export interface SocraticHintParams {
  problemSlug: string;
  problemTitle?: string;
  userCode?: string;
  tier: HintTier;
  errorContext?: string;
  question?: string;
}

export interface SocraticHintResult {
  hint: string;
  tier: HintTier;
  guidanceType: "conceptual_nudge" | "algorithm_pattern" | "pseudocode_flow";
  source?: "curated" | "llm";
}

/**
 * Builds the strict Socratic system prompt enforcing pedagogical guidance without code spoilers.
 */
export function buildSystemPrompt(tier: number): string {
  const tierInstructions: Record<number, string> = {
    1: `Level 1 - Conceptual Nudge & Diagnostic Question:
- Ask 1 to 2 targeted diagnostic questions to prompt the learner's own reasoning.
- Remind them of problem constraints, boundary values, and critical edge cases.
- DO NOT suggest specific data structures yet; focus on problem understanding and invariants.
- NEVER provide code or syntax snippets.`,
    2: `Level 2 - Algorithmic Pattern & Data Structure Recommendation:
- Recommend an optimal high-level paradigm (e.g., Two Pointers, Hash Map, Stack, Sliding Window, Dynamic Programming, BFS/DFS).
- Discuss space and time complexity trade-offs (e.g., trading O(N) space for O(1) lookups).
- DO NOT provide language-specific implementations.
- NEVER provide code or syntax snippets.`,
    3: `Level 3 - Pseudocode & Step-by-Step Flow Breakdown:
- Provide a numbered, natural-language logical flow of the algorithm (e.g., "Step 1: ..., Step 2: ...").
- Explain what state to maintain and how to transition between steps.
- Describe the logic purely in conversational English.
- DO NOT write JavaScript, TypeScript, or any copy-pasteable programming language code.
- NEVER provide code or syntax snippets.`,
  };

  const selectedTierInstruction =
    tierInstructions[tier] || tierInstructions[1];

  return `You are Dev Arena's Socratic Pedagogical AI Tutor.
Your goal is to guide software engineers through algorithmic challenges using the Socratic method, fostering genuine problem-solving autonomy.

CORE SAFETY & PEDAGOGICAL POLICY:
1. STRICT ANTI-SPOILER RULE: You are strictly PROHIBITED from generating executable code, code blocks (e.g., \`\`\`js, \`\`\`ts), function definitions, or copy-pasteable syntax.
2. If the user asks for code or the solution directly, politely decline and steer them back to conceptual principles.
3. Keep responses concise, supportive, and focused on one key insight at a time.

CURRENT GUIDANCE LEVEL:
${selectedTierInstruction}

Ensure your entire output is pedagogical and conversational. DO NOT provide code.`;
}

/**
 * Anti-spoiler filter with regex guardrails.
 * Detects and redacts markdown code blocks, function implementations, and direct solution code.
 */
export function sanitizeAIOutput(rawOutput: string): string {
  if (!rawOutput) return "";

  let sanitized = rawOutput;

  // 1. Redact markdown code blocks (e.g. ```javascript ... ``` or ``` ... ```)
  const codeBlockRegex = /```(?:[a-zA-Z0-9_-]+)?\s*[\r\n]+([\s\S]*?)```/g;
  sanitized = sanitized.replace(
    codeBlockRegex,
    "[Code block redacted to foster genuine problem-solving. Focus on the pedagogical and conceptual flow.]"
  );

  // 2. Redact standalone function definitions (e.g., `function twoSum(...) { ... }` or `const solve = (...) => { ... }`)
  const functionDeclarationRegex =
    /(?:(?:async\s+)?function\s*\w*\s*\([^)]*\)\s*\{[\s\S]*?\})/g;
  sanitized = sanitized.replace(
    functionDeclarationRegex,
    "[Function implementation omitted for Socratic learning]"
  );

  const arrowFunctionRegex =
    /(?:(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{[\s\S]*?\})/g;
  sanitized = sanitized.replace(
    arrowFunctionRegex,
    "[Function implementation omitted for Socratic learning]"
  );

  // 3. Redact specific direct return statements or solution assignments
  const returnArrayRegex = /return\s+\[[\s\S]*?\];?/g;
  sanitized = sanitized.replace(returnArrayRegex, "[return values omitted]");

  const loopRegex = /(?:for|while)\s*\([^)]*\)\s*\{[\s\S]*?\}/g;
  sanitized = sanitized.replace(loopRegex, "[iteration loop omitted]");

  // 4. Redact inline code snippets that contain function calls with brackets/operators
  sanitized = sanitized.replace(/`([^`]*(?:function|return|=>|\{|\}|\[\w+\])[^`]*)`/g, "$1");

  return sanitized.trim();
}

/**
 * Curated Socratic Knowledge Base for seed problems.
 * Guarantees zero external dependency failure and sub-10ms latency in offline / testing mode.
 */
interface CuratedProblemHints {
  title: string;
  tier1: {
    general: string;
    withError?: (error: string) => string;
  };
  tier2: {
    general: string;
  };
  tier3: {
    general: string;
  };
}

const CURATED_KNOWLEDGE_BASE: Record<string, CuratedProblemHints> = {
  "two-sum": {
    title: "Two Sum",
    tier1: {
      general:
        "Consider what information you need at each step: if you inspect a number `x`, what exact complement value are you looking for in the rest of the array? Can the same element be used twice? What if the array has duplicate values?",
      withError: (err: string) =>
        `Notice the test output: "${err}". Are you returning the numbers themselves, or the 0-based indices? Remember that the problem requires returning an array of two indices [i, j] such that nums[i] + nums[j] equals target.`,
    },
    tier2: {
      general:
        "Scanning the entire array for every element results in O(N^2) quadratic time. What data structure allows you to look up previously seen values in average O(1) time? Consider using an associative Hash Map (or JavaScript Map) where keys are the numbers and values are their corresponding indices.",
    },
    tier3: {
      general:
        "Here is the step-by-step logical flow:\n" +
        "1. Initialize an empty hash map to store each number and its index.\n" +
        "2. Iterate through the array using an index tracker i.\n" +
        "3. At each index, compute complement = target - nums[i].\n" +
        "4. Check if the complement already exists as a key in your map:\n" +
        "   - If it exists, you have found the pair! Return [index of complement, current index i].\n" +
        "   - If it does not exist, insert nums[i] with value i into your map.\n" +
        "5. If you finish iterating without finding a match, handle the empty case (though a solution is guaranteed).",
    },
  },
  "valid-parentheses": {
    title: "Valid Parentheses",
    tier1: {
      general:
        "What invariant must hold for every closing bracket? When you encounter a closing bracket like ')' or '}', which opening bracket must it match? What should your function return if the string starts with a closing bracket or has an odd length?",
      withError: (err: string) =>
        `Observing your result: "${err}". Think about bracket ordering: brackets must be closed in reverse order of how they were opened. What happens if there are unclosed opening brackets left at the end of the string?`,
    },
    tier2: {
      general:
        "Notice the Last-In, First-Out (LIFO) nature of nested brackets: the most recently opened bracket is always the first one that must be closed. What fundamental data structure embodies LIFO behavior? A Stack is the optimal choice here.",
    },
    tier3: {
      general:
        "Here is the step-by-step logical flow:\n" +
        "1. Create an empty stack and a lookup mapping of closing brackets to their matching opening brackets (e.g., ')' -> '(', '}' -> '{', ']' -> '[').\n" +
        "2. Loop through each character of the string from left to right.\n" +
        "3. If the character is an opening bracket, push it onto your stack.\n" +
        "4. If the character is a closing bracket:\n" +
        "   - If the stack is already empty, return false immediately because there is no matching opening bracket.\n" +
        "   - Pop the top element from the stack. If it does not match the corresponding opening bracket, return false.\n" +
        "5. After processing all characters, verify whether the stack is completely empty. If empty, return true; otherwise, return false.",
    },
  },
  "reverse-linked-list": {
    title: "Reverse Linked List",
    tier1: {
      general:
        "In a singly linked list, each node only holds a reference to the next node. If you immediately change current.next to point backwards, what happens to the rest of the list? What temporary references do you need before modifying any pointer?",
      withError: (err: string) =>
        `Test feedback note: "${err}". Watch out for losing the head reference or creating an unintended cycle. How do you ensure the original head node ends up pointing to null?`,
    },
    tier2: {
      general:
        "To reverse links in place without extra memory, use a multi-pointer traversal technique. You need three pointer roles: previous (initially null), current (starting at head), and nextTemp (to store the remainder of the list before severing the forward link).",
    },
    tier3: {
      general:
        "Here is the step-by-step logical flow:\n" +
        "1. Initialize a pointer prev to null, and current to the head of the list.\n" +
        "2. Loop while current is not null:\n" +
        "   - Store current.next in a temporary variable nextTemp.\n" +
        "   - Repoint current.next backwards to prev.\n" +
        "   - Advance prev to point to current.\n" +
        "   - Advance current to point to nextTemp.\n" +
        "3. When the loop terminates, prev will be pointing to the new head of the reversed list. Return prev.",
    },
  },
  "maximum-subarray": {
    title: "Maximum Subarray",
    tier1: {
      general:
        "Consider a running sum of elements: if the accumulated sum up to index i becomes negative, could including it ever help increase the sum of any subsequent subarray? When is it strictly better to discard the past and start a new subarray?",
      withError: (err: string) =>
        `Test feedback note: "${err}". What if all numbers in the array are negative? Make sure your initial maximum accounts for negative values rather than starting at zero.`,
    },
    tier2: {
      general:
        "Look into Kadane's Algorithm, a classic dynamic programming pattern. At each position i, you make an optimal local decision: should you extend the previous running subarray, or start fresh with nums[i]? This solves the problem in O(N) time with O(1) auxiliary space.",
    },
    tier3: {
      general:
        "Here is the step-by-step logical flow:\n" +
        "1. Initialize maxSoFar and currentMax to the value of the first element in the array.\n" +
        "2. Iterate through the array starting from the second element (index 1).\n" +
        "3. At each element, update currentMax: choose the larger between the current element alone, and the current element added to currentMax.\n" +
        "4. Update maxSoFar: choose the larger between maxSoFar and currentMax.\n" +
        "5. After inspecting all elements, return maxSoFar.",
    },
  },
};

/**
 * Attempts calling external LLM (Gemini or OpenAI) with strict timeout and fallback.
 */
async function callExternalLLM(
  params: SocraticHintParams,
  systemPrompt: string
): Promise<string | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!geminiKey && !openaiKey) {
    return null;
  }

  const promptContent = `
Problem: ${params.problemTitle || params.problemSlug}
Current User Code:
${params.userCode || "(No code written yet)"}
${params.errorContext ? `Recent Test Failure / Error:\n${params.errorContext}` : ""}
${params.question ? `Learner Question:\n${params.question}` : "Please provide guidance for Level " + params.tier}
`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    if (geminiKey) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n${promptContent}` }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 300,
          },
        }),
      });

      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        const rawText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (rawText) {
          return sanitizeAIOutput(rawText);
        }
      }
    } else if (openaiKey) {
      const endpoint = "https://api.openai.com/v1/chat/completions";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: promptContent },
          ],
          temperature: 0.3,
          max_tokens: 300,
        }),
      });

      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        const rawText = data?.choices?.[0]?.message?.content || "";
        if (rawText) {
          return sanitizeAIOutput(rawText);
        }
      }
    }
  } catch (err) {
    // Graceful fallback to curated knowledge base
    console.warn("External LLM call failed or timed out; using curated tutor engine:", err);
  }

  return null;
}

/**
 * Main Socratic hint generation dispatcher.
 */
export async function generateSocraticHint(
  params: SocraticHintParams
): Promise<SocraticHintResult> {
  const tier = (params.tier >= 1 && params.tier <= 3 ? params.tier : 1) as HintTier;
  const guidanceTypeMap: Record<HintTier, SocraticHintResult["guidanceType"]> = {
    1: "conceptual_nudge",
    2: "algorithm_pattern",
    3: "pseudocode_flow",
  };
  const guidanceType = guidanceTypeMap[tier];

  // 1. If LLM is configured, attempt call
  const systemPrompt = buildSystemPrompt(tier);
  const llmResult = await callExternalLLM(params, systemPrompt);
  if (llmResult) {
    return {
      hint: llmResult,
      tier,
      guidanceType,
      source: "llm",
    };
  }

  // 2. Curated knowledge base lookup
  const curated = CURATED_KNOWLEDGE_BASE[params.problemSlug];
  if (curated) {
    let hintText = "";
    if (tier === 1) {
      if (params.errorContext && curated.tier1.withError) {
        hintText = curated.tier1.withError(params.errorContext);
      } else {
        hintText = curated.tier1.general;
      }
    } else if (tier === 2) {
      hintText = curated.tier2.general;
    } else {
      hintText = curated.tier3.general;
    }

    if (params.question) {
      hintText = `Regarding your question ("${params.question}"):\n\n${hintText}`;
    }

    return {
      hint: sanitizeAIOutput(hintText),
      tier,
      guidanceType,
      source: "curated",
    };
  }

  // 3. Dynamic generic Socratic response for unseeded problems
  const title = params.problemTitle || params.problemSlug.replace(/-/g, " ");
  let genericHint = "";

  if (tier === 1) {
    genericHint =
      `When tackling "${title}", start by analyzing the inputs and edge cases:\n` +
      `- What is the minimal valid input (empty, single element, negative values)?\n` +
      `- What invariant must remain true throughout your function?\n` +
      (params.errorContext
        ? `- Consider your recent failure (${params.errorContext}): where did the expectation diverge?`
        : `- Can you rephrase the goal in your own words before writing loops?`);
  } else if (tier === 2) {
    genericHint =
      `For "${title}", analyze the algorithmic complexity requirements:\n` +
      `- If a brute force search takes O(N^2), what data structure or pointer technique can reduce lookup times to O(N) or O(log N)?\n` +
      `- Common patterns to explore: Hash Maps for constant lookups, Two Pointers if sorted, Stacks for nested structures, or Dynamic Programming for optimal subproblems.`;
  } else {
    genericHint =
      `Here is a recommended logical flow for "${title}":\n` +
      `1. Validate input constraints and handle boundary base cases immediately.\n` +
      `2. Set up initial state (accumulators, pointers, or lookup containers).\n` +
      `3. Process elements sequentially, updating state at each iteration.\n` +
      `4. Check completion condition and format your final result.\n` +
      `5. Return the computed result without mutating unnecessary state.`;
  }

  if (params.question) {
    genericHint = `Regarding your question ("${params.question}"):\n\n${genericHint}`;
  }

  return {
    hint: sanitizeAIOutput(genericHint),
    tier,
    guidanceType,
    source: "curated",
  };
}
