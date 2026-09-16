# Dev Arena &mdash; In-Browser Code Arena & Algorithm Learning Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Bun](https://img.shields.io/badge/Bun-1.4.2-fbf0df?style=flat&logo=bun)](https://bun.sh/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Neon](https://img.shields.io/badge/Neon-Serverless%20Postgres-00E599?style=flat&logo=postgresql)](https://neon.tech/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-0.45.2-C5F74F?style=flat)](https://orm.drizzle.team/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E%20Tests-2EAD33?style=flat&logo=playwright)](https://playwright.dev/)

> Master Data Structures & Algorithms with zero-lag in-browser Web Worker execution, Socratic AI coaching, empirical Big-O curve profiling, interactive DAG curriculum, and timed competitive arena contests.

---

## 🏛️ System Architecture

Dev Arena replaces traditional slow server compilation queues with client-side, sandbox-isolated Web Workers. Test suites execute locally in sub-200ms with zero network latency, while Neon Serverless PostgreSQL and Drizzle ORM manage persistent submissions, ratings, and curriculum state.

```mermaid
flowchart TD
    subgraph Browser ["Client Browser Environment"]
        UI["Next.js 16 App Router & React 19 UI"]
        Monaco["Monaco Code Editor (ES2024 / AST Markers)"]
        Worker["Isolated Web Worker Execution Sandbox\n(sub-200ms, 2000ms loop cutoff, console intercept)"]
        AST["Babel Static AST Inspector & Multi-N Profiler"]
        Radar["SVG Interactive DAG Tree & Radar Chart"]
    end

    subgraph Server ["Next.js Server & Edge API Routes"]
        API_Problems["/api/problems/[slug] (Metadata & Test Cases)"]
        API_Submissions["/api/submissions (Persistence & Scoring)"]
        API_Skills["/api/skills (Tree Evaluation & Mastery Radar)"]
        API_Contests["/api/contests (Leaderboard & Elo Rating)"]
        API_AI["/api/ai/hint (3-Tier Socratic Guidance)"]
    end

    subgraph Database ["Cloud Persistence Layer"]
        Neon[("Neon Serverless PostgreSQL")]
        Drizzle["Drizzle ORM Schema & Type-Safe Queries"]
    end

    UI --> Monaco
    UI --> Worker
    UI --> AST
    UI --> Radar

    UI -->|Evaluate / Submit| Server
    Server --> Drizzle
    Drizzle --> Neon
```

---

## 🚀 Key Feature Highlights

### 1. ⚡ Instant In-Browser Execution Sandbox
- **Zero-Latency Runs**: Algorithms execute in an isolated Web Worker directly in the user's browser, returning verdicts in **< 200ms**.
- **Infinite Loop Protection**: Built-in 2000ms hard timeout cutoff prevents browser freezing from unbounded recursion or infinite loops (`while (true)`).
- **Console Stream Interception**: `console.log`, `console.warn`, and `console.error` are safely captured per test case without corrupting test assertion pipelines.
- **Clean Stack Sanitization**: Internal runner harnesses and VM wrappers are stripped, accurately pinpointing the user's line and column numbers.

### 2. 🤖 Tiered Socratic AI Tutor
- **Non-Spoiling Pedagogical Guidance**: Strict regex guardrails strip copy-pasteable solution code blocks and function declarations.
- **3 Progressive Tiers**:
  - **Tier 1 (Conceptual Nudge)**: Diagnostic questions and edge case prompts (e.g. empty inputs, duplicates).
  - **Tier 2 (Algorithmic Pattern)**: Pattern suggestions (e.g. Hash Map $O(1)$ lookups, Two Pointers).
  - **Tier 3 (Pseudocode Flow)**: Step-by-step structural logic without revealing implementation syntax.
- **Context-Aware Error Diagnostics**: Tailored advice triggered by runtime exceptions, wrong answers, or syntax errors.

### 3. 🔍 Static AST & Empirical Big-O Complexity Profiling
- **Static Syntax Inspection**: Continuously inspects loop nesting depths, recursion, and syntax errors using `@babel/parser` and highlights warnings directly on Monaco Editor lines.
- **Multi-$N$ Benchmark Profiling**: Executes inputs of $N = 10, 100, 1000, 10000$ to empirically estimate Big-O time complexity ($O(1)$, $O(\log N)$, $O(N)$, $O(N \log N)$, $O(N^2)$) with visual growth curves.

### 4. 🌳 Structured DAG Curriculum & Skill Mastery Radar
- **Directed Acyclic Graph (DAG) Skill Tree**: Visual prerequisite unlocking engine. Advanced nodes (Sliding Window, Dynamic Programming, Graphs) remain locked until foundational topics are solidified.
- **Multi-Dimensional Skill Radar Chart**: Responsive SVG polygon radar visualizing mastery across core DSA domains (Arrays, Two Pointers, Trees, Dynamic Programming, Graphs).

### 5. 🏆 Timed Contests, ICPC Scoring & Rating Engine
- **Scheduled Competitions**: Real-time arena with synchronized countdown clocks and ICPC-style penalty scoring (10 minutes per wrong attempt).
- **Elo/Glicko-2 Rating Engine**: Dynamic post-contest rating recalculation and live updating leaderboards.
- **Gamification & Badges**: Unlockable achievements ("First Blood", "Streak 7", "Century Club", "Contest Champion") and public developer profiles.

### 6. 🤝 Community Discussions & Mock Interview Rooms
- **Solution Forum**: Community write-ups categorized by Big-O approaches with upvoting and Markdown preview.
- **Peer Mock Interviews**: Collaborative interview rooms with shared problem descriptions, evaluation rubrics, and countdown timers.

---

## 🛠️ Tech Stack & Verified Versions

| Category | Technology | Verified Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime & Package Manager** | [Bun](https://bun.sh/) | `^1.4.2` | High-performance JavaScript runtime & package management |
| **Frontend Framework** | [Next.js](https://nextjs.org/) (App Router) | `^16.3.5` | Hybrid SSR, Dynamic Routing, and Turbopack compiler |
| **UI Library** | [React](https://react.dev/) | `^19.3.0` | Declarative component UI framework |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `^4.3.3` | Utility-first responsive design & dark mode styling |
| **Code Editor** | [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react) | `^4.7.0` | Desktop-grade in-browser VS Code editing experience |
| **Database** | [Neon Serverless PostgreSQL](https://neon.tech/) | `^1.1.0` | Cloud serverless relational Postgres database |
| **ORM & Migrations** | [Drizzle ORM](https://orm.drizzle.team/) & Drizzle Kit | `^0.45.2` / `^0.31.10` | Lightweight, type-safe SQL queries and schema migrations |
| **AST Parser** | [@babel/parser](https://babeljs.io/) & `@babel/traverse` | `^8.0.5` | In-browser JavaScript AST static code quality inspection |
| **Unit Testing** | [Vitest](https://vitest.dev/) | `^5.0.1` | Lightning-fast unit & contract test suite |
| **E2E Testing** | [Playwright](https://playwright.dev/) | `^1.63.0` | Multi-browser end-to-end user journey validation |
| **Type Checking** | [TypeScript](https://www.typescriptlang.org/) | `^7.0.2` | Static type safety and strict verification |

---

## 💻 Local Setup & Development Guide

### Prerequisites
- [Bun](https://bun.sh/) (`>= 1.1.0`) installed on your system.

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-org/dev-arena.git
cd dev-arena
bun install
```

### 2. Environment Configuration
Create a `.env` or `.env.local` file in the root directory:
```env
# Database Connection (Neon Serverless PostgreSQL or local Postgres)
DATABASE_URL="postgresql://user:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Optional: Dedicated OpenAI / Gemini API Key for Socratic AI Tutor live queries
AI_TUTOR_API_KEY=""
```
*(Note: Dev Arena contains a complete offline pedagogical fallback engine for seed problems, allowing full local development and testing without an active external API key).*

### 3. Database Schema Setup & Seeding
```bash
# Push schema migrations to database
bun run db:push

# Seed canonical problem sets, benchmark cases, and skill DAG nodes
bun run db:seed
```

### 4. Launch Development Server
```bash
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to experience the platform.

---

## 🧪 Verification & Test Commands

Dev Arena follows rigorous Test-Driven Development (TDD) and multi-tier verification:

```bash
# 1. Static Type Checking (0 errors expected)
bun run typecheck

# 2. Run All Unit & Contract Tests (160+ tests across all user stories)
bun test

# 3. Run Playwright End-to-End Test Suite (Headless Chromium)
bun run test:e2e

# 4. Production Compilation & Static Page Optimization
bun run build
```

---

## 📂 Project Directory Structure

```text
dev-arena/
├── src/
│   ├── app/                          # Next.js 16 App Router pages & endpoints
│   │   ├── api/                      # RESTful API routes (problems, submissions, skills, contests, ai)
│   │   ├── contests/                 # Contest lobby and live competition arena
│   │   ├── interview/                # Peer mock interview lobby & collaborative room
│   │   ├── problems/                 # Problem library catalog and interactive workspace
│   │   ├── profile/                  # Developer profile, rating history, and badge showcase
│   │   ├── skills/                   # Curriculum roadmap, DAG Skill Tree & Mastery Radar
│   │   ├── layout.tsx                # Sticky top navigation bar, footer & global theme
│   │   └── page.tsx                  # Platform landing page and interactive sandbox preview
│   ├── components/
│   │   ├── ai/                       # AITutorPanel slide-over drawer
│   │   ├── analysis/                 # ComplexityCard & AstWarningsList
│   │   ├── curriculum/               # SkillTreeGraph (SVG DAG) & SkillRadarChart
│   │   ├── discussions/              # ProblemDiscussions forum with Markdown
│   │   ├── editor/                   # MonacoCodeEditor, EditorHeader, OutputPanel, SubmissionModal
│   │   └── profile/                  # BadgeList and user achievement badges
│   ├── lib/
│   │   ├── ai/                       # Socratic prompt engineering & anti-spoiler filters
│   │   ├── analysis/                 # AST loop depth scanner & empirical multi-N profiler
│   │   ├── contests/                 # Glicko-2/Elo rating engine, ICPC penalty scorer & badges
│   │   ├── curriculum/               # DAG cycle checking, prerequisite evaluator & catalog
│   │   ├── db/                       # Neon database client, Drizzle schema & seed scripts
│   │   ├── interview/                # Mock interview room code generator & rubric
│   │   └── runner/                   # WorkerRunnerManager, deep-equal & error-sanitizer
│   └── types/                        # Shared TypeScript types & interfaces
├── tests/
│   ├── contract/                     # API endpoint contract tests (Vitest)
│   ├── e2e/                          # Playwright end-to-end user journey tests
│   │   ├── solve-problem.spec.ts     # Two Sum solve, run, submit, and history test
│   │   ├── contests.spec.ts          # Contests filter, enter arena, timer & leaderboard test
│   │   └── curriculum.spec.ts        # DAG Skill Tree & SVG Radar Chart validation
│   └── unit/                         # Unit tests (AST, runner, rating, deep-equal, etc.)
├── specs/                            # Spec-Kit feature specifications, plans, and tasks
├── playwright.config.ts              # Playwright test configuration with Next.js webServer
└── package.json                      # Project dependencies, scripts, and engine versions
```

---

## 📄 License
This project is licensed under the MIT License &mdash; see the LICENSE file for details.
