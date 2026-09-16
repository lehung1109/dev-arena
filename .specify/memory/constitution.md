<!--
SYNC IMPACT REPORT
==================
Version Change: [CONSTITUTION_VERSION] (unratified template) -> 1.0.0
Modified Principles:
- Initialized core principles from template placeholders to 7 non-negotiable task generation and execution standards:
  * Principle I: Phase-Level Specification Quality
  * Principle II: Phase 1 Worktree Workspace Isolation
  * Principle III: Dedicated Subagent Execution per Phase
  * Principle IV: Mandatory Test-Driven Development (TDD)
  * Principle V: Iterative Review & Bug Hunt Subagent Loop
  * Principle VI: Phase-End Conventional Commits
  * Principle VII: Holistic Feature-Level Review & Finalization
Added Sections:
- Core Principles (I through VII)
- Task Breakdown & Phase Generation Standards
- Subagent Execution & Quality Gate Protocol
- Governance (superseding authority, compliance verification, amendment procedure, semver policy)
Removed Sections:
- Unused generic template placeholders ([PRINCIPLE_1_NAME] through [PRINCIPLE_5_NAME], [SECTION_2_NAME], [SECTION_3_NAME])
Follow-up TODOs:
- None. All placeholders have been resolved into declarative, testable rules.
==================
-->

# Dev Arena Constitution

## Core Principles

### I. Phase-Level Specification Quality
The `speckit-tasks` agent skill MUST read both the feature specification (`spec.md`) and implementation plan (`plan.md`) in full prior to generating tasks; generating tasks from partial context is strictly prohibited. Phases within the task breakdown MUST be strictly ordered by dependency, and referencing unbuilt upstream dependencies without declaring them first is prohibited. Specification quality requirements MUST apply at the phase level within tasks rather than being diluted across micro-tasks. Every phase defined in `tasks.md` MUST provide:
- Exact file paths for all files to be created, modified, or deleted (vague or wildcard-only file references are prohibited).
- Complete code, detailed pseudocode, or explicit technical guidance, avoiding vague high-level summaries.
- Explicit verification steps, including exact test commands, expected outputs, or measurable acceptance criteria.
- Actionable checklist items representing all mandatory phase workflow steps: Phase 1 worktree creation, dedicated subagent execution, TDD steps, iterative review subagent loop, phase-end commit, and the final feature-level review phase.

### II. Phase 1 Worktree Workspace Isolation
Implementation work MUST never pollute the active workspace or risk uncommitted working tree conflicts. Phase 1 MUST prioritize creating a new git worktree for workspace isolation before starting any implementation tasks. The workflow MUST prompt the user to confirm the creation of the new worktree, defaulting to creating a new one.

### III. Dedicated Subagent Execution per Phase
To prevent context saturation, instruction drift, and memory cross-contamination across phases, each phase MUST be executed within a dedicated subagent session. Subagents maintain clean context boundaries, focused objective scopes, and isolated execution logs for their assigned phase.

### IV. Mandatory Test-Driven Development (TDD)
Implementation tasks within each phase MUST strictly adhere to the Red-Green-Refactor discipline:
1. **Red**: Author an automated unit, contract, or integration test first and execute it to verify expected failure against the current code.
2. **Green**: Write the minimal production code necessary to satisfy the test requirements and verify that the test passes.
3. **Refactor**: Clean and optimize the implementation while confirming all tests remain green.
Writing implementation code prior to a failing test is prohibited.

### V. Iterative Review & Bug Hunt Subagent Loop
Phase completion is strictly gated by an autonomous review and defect elimination loop:
1. Upon completing all implementation tasks within a phase, a dedicated review subagent MUST be spawned to conduct a thorough code review, verify spec compliance against `spec.md` and `plan.md`, verify `eslint` and static linting rules, and perform aggressive bug hunting.
2. If any defects, lint errors, test regressions, or specification discrepancies are found, they MUST be resolved immediately.
3. After resolving all identified issues, another review subagent MUST be spawned to re-evaluate the phase and hunt for remaining issues.
4. This cycle (Review Subagent → Fix Bugs → Re-review Subagent) MUST repeat iteratively until zero bugs, zero lint errors, and zero discrepancies remain.

### VI. Phase-End Conventional Commits
Once all tasks in a phase are verified and the review loop confirms zero remaining bugs, all phase changes MUST be committed to the branch using a descriptive conventional commit message (e.g., `feat(...)`, `fix(...)`, `test(...)`). Uncommitted phase changes MUST NOT carry over into subsequent phases.

### VII. Holistic Feature-Level Review & Finalization
The final phase in `tasks.md` MUST be dedicated entirely to a holistic, feature-level review encompassing all previous phases:
1. A dedicated subagent MUST be spawned to conduct a comprehensive bug hunt and end-to-end integration review across the entire implemented feature.
2. Any bugs, edge-case failures, or integration regressions found MUST be fixed immediately.
3. After fixing identified issues, another review subagent MUST be spawned to re-evaluate the full feature implementation.
4. This cycle MUST repeat iteratively until zero bugs remain across the entire feature.
5. Once the final review loop confirms zero bugs and full spec compliance, a final comprehensive commit MUST be made to finalize the feature implementation.

## Task Breakdown & Phase Generation Standards

Every `tasks.md` document generated by `speckit-tasks` MUST conform to the following structural and organizational standards:

1. **Checklist Formatting**: Every task MUST strictly follow the markdown checklist format:
   `- [ ] [TaskID] [P?] [Story?] Description with exact file path`
   - Sequential Task IDs (e.g., `T001`, `T002`) in execution order.
   - `[P]` marker included only for tasks that can run in parallel without file conflicts or incomplete dependencies.
   - `[Story]` label (e.g., `[US1]`, `[US2]`) attached to user story phase tasks.
2. **Phase Architecture**:
   - **Phase 1: Setup & Workspace Isolation**: Prompts user to confirm git worktree creation (defaulting to create), configures project foundation, tooling, and baseline environment.
   - **Phase 2: Foundational Infrastructure**: Implements blocking architectural components, shared schemas, data models, or shared utilities required across user stories.
   - **Phase 3+ : User Story Phases**: Grouped strictly by user story in priority order (P1, P2, P3, ...). Each phase forms a complete, independently testable functional increment.
   - **Final Phase: Holistic Feature Review & Finalization**: Comprehensive cross-phase integration review, end-to-end testing, final bug hunt loop, and feature finalization commit.
3. **Phase-Level Completeness**: Each phase section in `tasks.md` MUST contain:
   - Clear goal and acceptance criteria.
   - Exact file paths for every affected file.
   - Complete code snippets, pseudocode, or explicit technical instructions.
   - Exact validation commands (e.g., test runner invocations, linter checks, expected CLI exit codes).
   - Explicit workflow checklist items for launching the dedicated subagent, TDD steps, the iterative review subagent loop, and the phase-end commit.

## Subagent Execution & Quality Gate Protocol

Executing agents (such as `speckit-implement` and subagents) MUST execute `tasks.md` according to the following quality gates:

1. **Subagent Session Isolation**: Every phase MUST be delegated to a fresh, dedicated subagent. A single subagent session MUST NOT span across multiple implementation phases.
2. **TDD Gate**: In each phase, the subagent MUST prove test failure prior to writing implementation code. No task marked as an implementation task may be completed without preceding test verification.
3. **Iterative Review Subagent Gate**:
   - The implementing subagent signals task completion for the phase.
   - A distinct review subagent is launched to audit the phase diff, verify `spec.md` compliance, run test suites, check `eslint`, and hunt for logic and edge-case bugs.
   - If issues are detected, fixes are applied and a subsequent review subagent is dispatched to re-audit.
   - Phase gate clears only when a review subagent certifies zero bugs and zero lint/type errors.
4. **Commit Gate**: A clean git commit adhering to the Conventional Commits specification MUST be executed immediately upon clearing the phase review gate.
5. **Holistic Feature Finalization Gate**: The final feature review phase executes independently of individual phase reviews, verifying end-to-end integration, performance, edge cases, and documentation before final commit.

## Governance

This Constitution is the supreme development and planning policy for Dev Arena. It supersedes all informal agent workflows, personal preferences, and ad-hoc task generation routines.

1. **Compliance Verification**: All agent interactions and artifacts—especially `tasks.md` generated by `speckit-tasks` and executions performed by `speckit-implement`—MUST be strictly verified against this Constitution. Task breakdowns lacking phase-level technical specifications, verification commands, or mandatory workflow checklist items (worktrees, subagent boundaries, TDD, iterative review loops, commits) MUST be rejected and regenerated.
2. **Amendment Procedure**: Amendments to this Constitution require explicit documentation, impact assessment, and formal ratification. Proposed amendments must be recorded with updated ratification or amendment dates.
3. **Semantic Versioning Policy**:
   - **MAJOR** version bumps (`X.0.0`) indicate breaking changes to core principles, removal of quality gates, or fundamental redefinition of governance rules.
   - **MINOR** version bumps (`x.Y.0`) indicate the addition of new principles, sections, or materially expanded workflow criteria.
   - **PATCH** version bumps (`x.y.Z`) indicate clarifications, non-semantic wording refinements, or typo corrections.
4. **Runtime Reference**: Agents MUST read `.specify/memory/constitution.md` during task generation and implementation workflows to enforce all active constraints.

**Version**: 1.0.0 | **Ratified**: 2026-09-16 | **Last Amended**: 2026-09-16
