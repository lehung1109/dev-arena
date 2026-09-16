# Architectural & Technical Research: In-Browser Code Arena

**Feature**: `001-in-browser-code-arena`  
**Date**: 2026-09-16  
**Status**: Completed  

---

## 1. Runtime, Framework & Package Manager

### Decision
Use **Bun** (`^1.4.2`) as the package manager and development runtime, paired with **Next.js 16+** (`^16.3.5`, App Router), **React 19** (`^19.3.0`), and **TypeScript 7.0+** (`^7.0.2`).

### Rationale
- **Bun**: Provides ultra-fast package installation, built-in test runner capabilities, and native TypeScript support without overhead.
- **Next.js App Router**: Provides modern React Server Components (RSC) for zero-JS landing/catalog pages, server-side data fetching for problem descriptions, and integrated Route Handlers for REST API endpoints (`/api/problems`, `/api/submissions`).
- **Single Cohesive Repository**: Keeps front-end UI and back-end API contracts in one codebase with unified TypeScript types.

### Alternatives Considered
- *Node.js (npm/pnpm) + Next.js*: Viable, but Bun offers significantly faster dependency installation and build scripts.
- *Vite SPA + Separate Express Backend*: Evaluated during brainstorming. Rejected because it introduces dual-repository/process maintenance, lacks SSR for problem search indexing, and adds unnecessary complexity for MVP.

---

## 2. Database & ORM: Neon Serverless PostgreSQL with Drizzle ORM

### Decision
Use **Neon Serverless PostgreSQL** connected via **Drizzle ORM** (`drizzle-orm/neon-http` and `@neondatabase/serverless`).

### Rationale
- **Zero TCP Connection Exhaustion**: Traditional ORMs open persistent TCP connections, which fail in serverless lambdas (Vercel) when scaling to hundreds of concurrent executions. `@neondatabase/serverless` with `neon-http` executes SQL queries over stateless HTTP, completely eliminating connection pool exhaustion.
- **Lightweight Footprint**: Drizzle ORM has an ultra-lightweight bundle size (~60KB vs Prisma's >15MB engine binary), reducing serverless function cold starts to virtually zero.
- **Type Safety**: Drizzle provides end-to-end TypeScript inference directly from schema definitions with `drizzle-zod` for request validation.
- **Vercel Integration**: Direct one-click provisioning with environment variable `DATABASE_URL` (and pooled connection string for runtime).

### Alternatives Considered
- *Prisma ORM with `@prisma/adapter-neon`*: Capable, but heavier bundle size and slower cold start times compared to Drizzle on serverless functions.
- *SQLite (better-sqlite3)*: Great for local-only, but fails when deployed to Vercel/serverless environments without persistent volumes.

---

## 3. In-Browser Execution Sandbox & Safety Pipeline

### Decision
Implement code execution inside a dedicated **Web Worker (`runner.worker.ts`)** orchestrated by a client-side **`WorkerRunnerManager`**.

### Architecture & Pipeline
1. **Context Isolation**:
   - The user's solution code and test runner are executed inside a standalone Web Worker thread, ensuring the browser's main UI thread never blocks or drops frames.
2. **Infinite Loop & Safety Protection (TLE)**:
   - The manager sets a strict 2000ms timer (`setTimeout`).
   - If the worker does not post an execution complete event within 2000ms, `worker.terminate()` is called immediately, abruptly killing runaway threads (e.g., `while(true){}`).
   - A fresh worker is spawned for subsequent runs.
3. **Console Logging Stream**:
   - Inside the worker, `console.log`, `console.info`, `console.warn`, and `console.error` are intercepted via a Proxy/wrapper and appended to an in-memory execution trace buffer, which is returned in the result payload per test case.
4. **Result Verification**:
   - The runner invokes the solution function with structured test inputs, catches return values, and executes deep structural comparison against `expected` output using a fast deep-equality routine.
5. **Stacktrace Sanitization**:
   - If a runtime error occurs, the internal worker boilerplate frames are filtered out using regular expressions, highlighting only the user code line number and column.

### Alternatives Considered
- *WebAssembly QuickJS VM*: Provides exact opcode cycle counting, but increases download bundle size by >1.5MB and adds complexity for initial JavaScript/Node.js MVP.
- *Iframe Sandbox*: Insecure against infinite loops (an infinite loop inside an iframe freezes the entire browser process and UI thread).
- *Remote Server Judge (Judge0 / Docker)*: Introduces high infrastructure costs, queue latency (1–3s), and network dependence. In-browser execution delivers sub-200ms latency at $0 compute cost.

---

## 4. Static AST Analysis & Big-O Complexity Estimation

### Decision
Use **`@babel/parser`** running directly in the browser for static code inspection, combined with an **empirical multi-point benchmark profiler**.

### Rationale
- **AST Parsing (`@babel/parser`)**:
  - Extremely robust and compliant with modern ES2022+ syntax.
  - Detects AST node structures: counts `ForStatement`, `WhileStatement`, `ForOfStatement` nesting levels.
  - Identifies recursive call patterns (function identifier referencing itself in its body).
  - Highlights syntax errors with exact line and column coordinates for Monaco editor markers.
- **Empirical Profiling**:
  - Runs the user's code against inputs of size $N = 10, 100, 1000, 10000$ (using pre-configured benchmark generators).
  - Measures execution time ratios ($T(2N) / T(N)$):
    - Ratio $\approx 1 \rightarrow O(1)$ or $O(\log N)$
    - Ratio $\approx 2 \rightarrow O(N)$
    - Ratio $\approx 2 \times \log(2N)/\log(N) \rightarrow O(N \log N)$
    - Ratio $\approx 4 \rightarrow O(N^2)$
  - Gives practical, empirical feedback to learners without requiring full AI inference.

### Alternatives Considered
- *Acorn Parser*: Smaller bundle, but Babel parser handles modern syntax extensions, JSX, and TypeScript annotations seamlessly.
- *Pure AI-based Complexity Guessing*: High latency, variable accuracy, and requires API tokens for every code run.

---

## 5. Interactive Code Editor: Monaco Editor

### Decision
Integrate **`@monaco-editor/react`** loaded dynamically with client-side rendering (`'use client'`).

### Rationale
- Standard industry experience (identical to VS Code).
- Built-in TypeScript/JavaScript IntelliSense, auto-completion, bracket matching, and folding.
- Seamless marker API (`monaco.editor.setModelMarkers`) allowing AST warnings and runtime errors to underline problem code in red/yellow directly on the editor surface.

### Alternatives Considered
- *CodeMirror 6*: Lighter weight, but Monaco provides the most authentic, industry-standard interview preparation experience.

---

## 6. Socratic AI Tutor Prompt & Scaffolding Pipeline

### Decision
Implement a tiered, stateful prompt pipeline via a serverless API route (`/api/ai/hint`) interfacing with an LLM provider (Gemini / Claude / OpenAI).

### Guardrails
1. **Tier 1 (Conceptual Nudge)**: Prompts restrict the AI to asking leading Socratic questions about problem constraints, boundary values, and edge cases.
2. **Tier 2 (Algorithmic Pattern)**: Recommends high-level paradigms (e.g., "Think about using a two-pointer approach from both ends").
3. **Tier 3 (Pseudocode Breakdown)**: Outlines algorithmic steps in bulleted natural language.
4. **Strict System Policy**: Output format is audited with regex guardrails forbidding triple-backtick JavaScript code blocks (` ```javascript `) or explicit variable assignments that give away the solution.

---

## 7. Gamification, Rating & Real-Time Contests

### Decision
- **Rating Algorithm**: Glicko-2 / Elo rating variant recalculated asynchronously upon contest conclusion.
- **Contest Scoring**: Standard ICPC-style: Problem points awarded on AC, with +10 minute penalty for rejected submissions prior to acceptance.
- **Data Model**: Optimized PostgreSQL tables with indexed composite keys (`contest_id`, `score DESC`, `total_penalty ASC`) for instant leaderboard queries.
