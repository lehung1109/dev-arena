# Implementation Plan: In-Browser Code Arena & Algorithm Learning Platform

**Branch**: `001-in-browser-code-arena` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-in-browser-code-arena/spec.md`

---

## Summary

Build the foundational core of Dev Arena: a high-performance online coding and algorithm learning platform. The platform enables learners to solve Data Structures & Algorithms challenges in JavaScript/Node.js, executed 100% inside an isolated in-browser Web Worker (< 200ms feedback, strict 2,000ms TLE protection), verified against comprehensive public and hidden test cases, and analyzed via client-side AST inspection (`@babel/parser`) and empirical Big-O profiling. User submissions, curriculum progression across a DAG Skill Tree, and performance metrics are persisted to Neon Serverless PostgreSQL using Drizzle ORM in a unified Next.js App Router application powered by the Bun runtime.

---

## Technical Context

**Language/Version**: TypeScript 7.0+ (`^7.0.2`), Bun v1.4+ (`^1.4.2`, development runtime & package manager), Node.js v20+ compatibility  
**Primary Dependencies**: Next.js 16+ (`^16.3.5`, App Router), React 19 (`^19.3.0`), `@monaco-editor/react` (`^4.7.0`), `@babel/parser` (`^8.0.5`), `@babel/traverse` (`^8.0.5`), Drizzle ORM (`^0.45.2`, `drizzle-orm/neon-http`), Drizzle Kit (`^0.31.10`), `@neondatabase/serverless` (`^1.1.0`), Tailwind CSS (`^4.3.3`), Lucide React (`^1.46.0`), Radix UI  
**Storage**: Neon Serverless PostgreSQL (provisioned via Vercel integration, stateless HTTP driver via `DATABASE_URL`)  
**Testing**: Bun test / Vitest (`^5.0.1`, unit & contract tests), Playwright (`^1.63.0`, browser E2E)  
**Target Platform**: Modern Web Browsers (Chrome, Firefox, Safari, Edge with Web Workers) + Serverless Vercel runtime  
**Project Type**: Full-Stack Web Application (Next.js App Router)  
**Performance Goals**:
- In-browser test execution verdict rendered in $< 200\text{ ms}$ for standard inputs.
- Hard safety cutoff for infinite loops at $2,000\text{ ms} \pm 100\text{ ms}$.
- Serverless API latency $p95 < 100\text{ ms}$ on Neon PostgreSQL queries.
**Constraints**:
- 100% client-side execution for code evaluation: $0 server execution cost, zero remote queueing delay.
- Stateless HTTP database communication to completely eliminate serverless connection pool exhaustion.
- Sandboxed execution resilience: user code cannot mutate global page state, hijack parent console, or freeze the browser tab.
**Scale/Scope**: 50+ curated algorithm problems across 18 DSA topic domains, full DAG skill progression graph, and support for 1,000+ concurrent active learners.

---

## Constitution Check

*GATE: All principles from `.specify/memory/constitution.md` evaluated and satisfied.*

| Principle | Requirement | Plan Compliance Status |
|---|---|---|
| **I. Phase-Level Specification Quality** | Tasks must specify exact file paths, full code guidance, explicit verification commands, and ordered dependencies. | **PASS** — Defined in `data-model.md`, `contracts/`, and `quickstart.md`. `speckit-tasks` will generate phase-level checklists. |
| **II. Phase 1 Worktree Workspace Isolation** | Implementation work must use an isolated git worktree for development. | **PASS** — Phase 1 of `tasks.md` will mandate confirmation and creation of a dedicated git worktree before any code is scaffolded. |
| **III. Dedicated Subagent Execution per Phase** | Each implementation phase must run in an isolated subagent session. | **PASS** — Phase execution protocol will launch a dedicated subagent per phase. |
| **IV. Mandatory Test-Driven Development (TDD)** | Red-Green-Refactor sequence strictly required for all tasks. | **PASS** — Unit tests for runner, AST parser, and API route contracts will precede implementation code. |
| **V. Iterative Review & Bug Hunt Subagent Loop** | Autonomous review subagent loop until zero bugs/lint errors remain. | **PASS** — Built into phase gates in `tasks.md`. |
| **VI. Phase-End Conventional Commits** | Atomic conventional commit after clearing review loop. | **PASS** — Strict commit gate per phase. |
| **VII. Holistic Feature-Level Review** | Final phase dedicated to comprehensive cross-phase review. | **PASS** — Final phase will execute end-to-end integration review. |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-in-browser-code-arena/
├── spec.md                  # Feature requirements & user scenarios
├── plan.md                  # This implementation plan
├── research.md              # Technical decisions & architecture research
├── data-model.md            # Database schema & entity definitions
├── quickstart.md            # End-to-end validation guide
├── contracts/               # External & internal interface contracts
│   ├── runner-worker-contract.ts
│   ├── problems-api.yaml
│   ├── submissions-api.yaml
│   └── skills-api.yaml
└── checklists/
    └── requirements.md      # Specification quality checklist
```

### Source Code (repository root layout)

```text
dev-arena/
├── src/
│   ├── app/                               # Next.js App Router
│   │   ├── layout.tsx                     # Root layout with theme provider
│   │   ├── page.tsx                       # Landing page & hero
│   │   ├── problems/
│   │   │   ├── page.tsx                   # Problem catalog with filters
│   │   │   └── [slug]/
│   │   │       └── page.tsx               # Problem workspace (editor + runner panel)
│   │   ├── skills/
│   │   │   └── page.tsx                   # Interactive DAG Skill Tree & Radar
│   │   ├── contests/
│   │   │   └── page.tsx                   # Contests & Leaderboard
│   │   └── api/
│   │       ├── problems/
│   │       │   ├── route.ts               # GET /api/problems
│   │       │   └── [slug]/
│   │       │       ├── route.ts           # GET /api/problems/[slug]
│   │       │       └── test-cases/
│   │       │           └── route.ts       # GET /api/problems/[slug]/test-cases
│   │       ├── submissions/
│   │       │   ├── route.ts               # POST, GET /api/submissions
│   │       │   └── [id]/
│   │       │       └── route.ts           # GET /api/submissions/[id]
│   │       └── skills/
│   │           ├── tree/
│   │           │   └── route.ts           # GET /api/skills/tree
│   │           └── radar/
│   │               └── route.ts           # GET /api/skills/radar
│   ├── components/
│   │   ├── editor/
│   │   │   ├── MonacoCodeEditor.tsx       # Monaco wrapper with theme and AST markers
│   │   │   ├── EditorHeader.tsx           # Language selector, reset, run/submit buttons
│   │   │   └── OutputPanel.tsx            # Test case tabs, console logs, diff output
│   │   ├── analysis/
│   │   │   ├── ComplexityCard.tsx         # Big-O estimation & empirical graph
│   │   │   └── AstWarningsList.tsx        # Loop depth & recursion notices
│   │   ├── curriculum/
│   │   │   ├── SkillTreeGraph.tsx         # Interactive DAG visualizer
│   │   │   └── SkillRadarChart.tsx        # Mastery radar component
│   │   └── ui/                            # Shared Radix UI / Tailwind components
│   ├── lib/
│   │   ├── db/
│   │   │   ├── client.ts                  # Neon HTTP Drizzle client singleton
│   │   │   ├── schema.ts                  # Drizzle table definitions
│   │   │   └── seeds/
│   │   │       └── seed-problems.ts       # Initial curated problem dataset
│   │   ├── runner/
│   │   │   ├── runner.worker.ts           # Sandboxed execution Web Worker
│   │   │   ├── WorkerRunnerManager.ts     # Lifecycle, timeout (TLE) & event orchestrator
│   │   │   ├── deep-equal.ts              # Robust deep-equality assertion engine
│   │   │   └── error-sanitizer.ts         # User-facing line/column stack sanitizer
│   │   └── analysis/
│   │       ├── ast-analyzer.ts            # @babel/parser AST scanner
│   │       └── complexity-profiler.ts     # Multi-N empirical growth calculator
│   └── types/
│       ├── db.ts                          # Inferred Drizzle schema types
│       └── runner.ts                      # Runner & Worker interfaces
├── drizzle.config.ts                      # Drizzle Kit migration configuration
├── bunfig.toml                            # Bun runtime configuration
├── package.json                           # Dependencies and scripts
└── tests/
    ├── unit/
    │   ├── runner-manager.test.ts         # Worker lifecycle & TLE cutoff test
    │   ├── deep-equal.test.ts             # Comparison assertion suite
    │   ├── ast-analyzer.test.ts           # Loop depth & recursion detection test
    │   └── complexity-profiler.test.ts    # Multi-N curve fitting test
    ├── contract/
    │   ├── problems-api.test.ts           # Problems API route contract tests
    │   └── submissions-api.test.ts        # Submissions API route contract tests
    └── e2e/
        └── solve-problem.spec.ts          # Playwright user journey: Solve Two Sum
```

**Structure Decision**: A cohesive Next.js App Router full-stack repository (`src/` layout). It places database models (`lib/db`), client sandbox execution engines (`lib/runner`), and static analysis (`lib/analysis`) in modular, independently testable units, while UI components (`components/`) and Route Handlers (`app/api/`) adhere to Next.js best practices.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| None | N/A | Design follows standard Next.js App Router patterns without extraneous architectural layers. |
