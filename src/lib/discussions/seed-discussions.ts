export interface DiscussionAuthor {
  id: string;
  username: string;
  avatarUrl?: string;
}

export interface DiscussionItem {
  id: string;
  problemSlug: string;
  title: string;
  content: string;
  approachTags: string[];
  upvotes: number;
  createdAt: string;
  author: DiscussionAuthor;
}

export const INITIAL_DISCUSSIONS: DiscussionItem[] = [
  {
    id: "disc-two-sum-1",
    problemSlug: "two-sum",
    title: "Optimal O(N) Hash Map Approach with Step-by-Step Visualization",
    content: `### Intuition
Instead of comparing every pair of numbers with nested loops ($O(N^2)$), we can remember each number's index as we iterate through the array. 

For each number $x$ at index $i$, its needed complement is $target - x$. If the complement already exists in our hash map, we found our pair!

### Complexity
- **Time Complexity:** $O(N)$ - We traverse the array of length $N$ exactly once. Each lookup in the hash map takes $O(1)$ average time.
- **Space Complexity:** $O(N)$ - In the worst case, we store up to $N$ elements in the hash map.

### JavaScript Solution
\`\`\`javascript
function twoSum(nums, target) {
  const map = new Map();

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }

  return [];
}
\`\`\`
`,
    approachTags: ["O(N) Time", "O(N) Space", "Hash Table"],
    upvotes: 42,
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    author: {
      id: "u-neo-dev",
      username: "neo_coder",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=neo_coder",
    },
  },
  {
    id: "disc-two-sum-2",
    problemSlug: "two-sum",
    title: "Beginner Friendly Two-Pass Solution & Intuition",
    content: `### Conceptual Explanation
If you are new to hash tables, a 2-pass approach can be easier to reason about:

1. **Pass 1:** Populate the hash map with all elements and their indices.
2. **Pass 2:** Iterate through the array again and check if $(target - nums[i])$ exists and is not at the same index $i$.

\`\`\`javascript
function twoSumTwoPass(nums, target) {
  const map = new Map();
  // Pass 1
  for (let i = 0; i < nums.length; i++) {
    map.set(nums[i], i);
  }

  // Pass 2
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement) && map.get(complement) !== i) {
      return [i, map.get(complement)];
    }
  }

  return [];
}
\`\`\`
`,
    approachTags: ["O(N) Time", "O(N) Space", "Hash Table", "Beginner"],
    upvotes: 28,
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    author: {
      id: "u-algo-guru",
      username: "algo_queen",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=algo_queen",
    },
  },
  {
    id: "disc-two-sum-3",
    problemSlug: "two-sum",
    title: "Brute Force O(N^2) Approach with Nested Loops (Why it's sub-optimal)",
    content: `### Brute Force
The simplest approach is to check every possible pair with two nested loops:

\`\`\`javascript
function twoSumBruteForce(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}
\`\`\`

- **Time Complexity:** $O(N^2)$ because of two nested loops.
- **Space Complexity:** $O(1)$ since no extra data structures are used.
This will exceed the time limit on large benchmark arrays ($N > 10,000$).
`,
    approachTags: ["O(N^2) Time", "O(1) Space", "Brute Force"],
    upvotes: 11,
    createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    author: {
      id: "u-code-wizard",
      username: "code_wizard",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=code_wizard",
    },
  },
  {
    id: "disc-valid-parentheses-1",
    problemSlug: "valid-parentheses",
    title: "Classic Stack Solution with Early Exit in O(N)",
    content: `### Why a Stack?
Parentheses matching is a classic LIFO (Last-In-First-Out) problem. The most recently opened bracket must be the first one to close.

\`\`\`javascript
function isValid(s) {
  if (s.length % 2 !== 0) return false;

  const stack = [];
  const map = {
    ')': '(',
    '}': '{',
    ']': '['
  };

  for (const char of s) {
    if (char in map) {
      if (stack.pop() !== map[char]) return false;
    } else {
      stack.push(char);
    }
  }

  return stack.length === 0;
}
\`\`\`
`,
    approachTags: ["O(N) Time", "O(N) Space", "Stack"],
    upvotes: 35,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    author: {
      id: "u-stack-fan",
      username: "stack_master",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=stack_master",
    },
  },
  {
    id: "disc-reverse-linked-list-1",
    problemSlug: "reverse-linked-list",
    title: "Iterative Three-Pointer In-Place Reversal O(1) Space",
    content: `### Three Pointers: prev, curr, nextTemp
We iterate through the linked list with three pointers:
1. Store \`curr.next\` in \`nextTemp\`
2. Change \`curr.next = prev\`
3. Advance \`prev = curr\` and \`curr = nextTemp\`

\`\`\`javascript
function reverseList(head) {
  let prev = null;
  let curr = head;

  while (curr !== null) {
    const nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }

  return prev;
}
\`\`\`
`,
    approachTags: ["O(N) Time", "O(1) Space", "Two Pointers", "Linked List"],
    upvotes: 39,
    createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    author: {
      id: "u-list-expert",
      username: "pointer_pro",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=pointer_pro",
    },
  },
];

// In-memory store for discussions during execution
let discussionsStore: DiscussionItem[] = [...INITIAL_DISCUSSIONS];

export function getDiscussionsByProblem(slug: string, tag?: string): DiscussionItem[] {
  let posts = discussionsStore.filter(
    (p) => p.problemSlug.toLowerCase() === slug.toLowerCase()
  );

  if (tag && tag.trim()) {
    const lowerTag = tag.trim().toLowerCase();
    posts = posts.filter((p) =>
      p.approachTags.some((t) => t.toLowerCase() === lowerTag)
    );
  }

  // Sort by upvotes DESC, then createdAt DESC
  return [...posts].sort((a, b) => {
    if (b.upvotes !== a.upvotes) {
      return b.upvotes - a.upvotes;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function addDiscussion(
  slug: string,
  post: {
    title: string;
    content: string;
    approachTags?: string[];
    authorName?: string;
  }
): DiscussionItem {
  const newPost: DiscussionItem = {
    id: `disc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    problemSlug: slug,
    title: post.title,
    content: post.content,
    approachTags: post.approachTags && post.approachTags.length > 0
      ? post.approachTags
      : ["Community Solution"],
    upvotes: 0,
    createdAt: new Date().toISOString(),
    author: {
      id: `u-${Date.now()}`,
      username: post.authorName?.trim() || "coder_guest",
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${post.authorName || "coder_guest"}`,
    },
  };

  discussionsStore.unshift(newPost);
  return newPost;
}

export function upvoteDiscussion(id: string): DiscussionItem | null {
  const post = discussionsStore.find((p) => p.id === id);
  if (!post) {
    return null;
  }
  post.upvotes += 1;
  return post;
}

export function resetDiscussionsStore(): void {
  discussionsStore = [...INITIAL_DISCUSSIONS];
}
