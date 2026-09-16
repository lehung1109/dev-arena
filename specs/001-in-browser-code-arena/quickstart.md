# Quickstart & Validation Guide: In-Browser Code Arena

**Feature**: `001-in-browser-code-arena`  
**Date**: 2026-09-16  

---

## 1. Prerequisites

- **Bun**: v1.4.2 or higher installed (`bun --version`)
- **Node.js**: v20+ (for Next.js 16 tooling compatibility)
- **Git**: Configured for repository tracking
- **Neon Database Connection URL**: A PostgreSQL connection string (`DATABASE_URL`) from Neon (e.g., via Vercel Neon Integration). For local development prior to provisioning, a local Postgres or mock environment can be utilized.

---

## 2. Environment Setup

```bash
# 1. Clone/navigate to repository root
cd F:\projects\dev-arena

# 2. Install dependencies via Bun
bun install

# 3. Configure environment variables (.env.local)
cp .env.example .env.local
# Set:
# DATABASE_URL="postgresql://user:password@ep-something-pooler.region.aws.neon.tech/neondb?sslmode=require"
```

---

## 3. Database Schema Push & Seeding

```bash
# Generate and push Drizzle schema to Neon PostgreSQL
bun run db:push

# Seed initial DSA problems and Skill Tree nodes
bun run db:seed
```

---

## 4. Running the Development Server

```bash
# Start Next.js development server with Bun
bun dev
```
Navigate to `http://localhost:3000` in a modern browser (Chrome, Firefox, Safari, Edge).

---

## 5. End-to-End Validation Scenarios

### Scenario 1: Solve "Two Sum" & Run Public Tests (Sub-200ms)
1. Navigate to `/problems/two-sum`.
2. Observe starter code in Monaco Editor:
   ```javascript
   function twoSum(nums, target) {
     // Your code here
   }
   ```
3. Type the optimal solution:
   ```javascript
   function twoSum(nums, target) {
     const map = new Map();
     for (let i = 0; i < nums.length; i++) {
       const complement = target - nums[i];
       if (map.has(complement)) return [map.get(complement), i];
       map.set(nums[i], i);
     }
     return [];
   }
   ```
4. Click **Run Code**.
5. **Expected Outcome**:
   - Status badge shows `Accepted` (Green) across all public test cases.
   - Execution duration is reported under `50ms`.
   - No UI freeze or lag occurs.

---

### Scenario 2: Safety & Infinite Loop Termination (TLE at 2000ms)
1. In the editor, enter an intentional infinite loop:
   ```javascript
   function twoSum(nums, target) {
     while (true) {}
   }
   ```
2. Click **Run Code**.
3. **Expected Outcome**:
   - Web Worker is terminated at exactly 2,000ms ($\pm 100\text{ ms}$).
   - Verdict displays `Time Limit Exceeded (TLE)`.
   - Browser tab remains responsive and user can continue typing immediately.

---

### Scenario 3: Static AST Analysis & Nested Loop Warning
1. In the editor, enter a brute-force $O(N^2)$ solution:
   ```javascript
   function twoSum(nums, target) {
     for (let i = 0; i < nums.length; i++) {
       for (let j = i + 1; j < nums.length; j++) {
         if (nums[i] + nums[j] === target) return [i, j];
       }
     }
     return [];
   }
   ```
2. Observe the Analysis tab in the execution panel.
3. **Expected Outcome**:
   - AST parser flags `Max Loop Nesting: 2`.
   - Structural warning: "Potential $O(N^2)$ algorithm detected. Consider optimizing with a Hash Map."

---

### Scenario 4: Submit Solution & Skill Tree Progression
1. With the optimal solution entered, click **Submit**.
2. **Expected Outcome**:
   - System runs all hidden edge-case tests.
   - Verdict is saved to `submissions` table in Neon PostgreSQL.
   - Problem status switches to "Solved".
   - Navigate to `/skills`; observe the "Arrays & Hashing" node progress counter incremented by 1, updating the Skill Radar chart.

---

## 6. Automated Testing Verification

```bash
# Run unit tests for WorkerRunner, AST parser, and deep equality
bun test

# Run contract tests against API route handlers
bun test:contract

# Run Playwright E2E browser tests
bun run test:e2e
```
