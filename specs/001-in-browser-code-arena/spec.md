# Feature Specification: In-Browser Code Arena & Algorithm Learning Platform

**Feature Branch**: `001-in-browser-code-arena`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "Thiết kế một nền tảng luyện lập trình trực tuyến (Dev Arena) giúp người dùng học thuật toán và cấu trúc dữ liệu từ cơ bản đến nâng cao; giải bài tập bằng JavaScript/Node.js; chạy và chấm code trực tiếp trên trình duyệt; nhận kết quả, gợi ý, phân tích lỗi và độ phức tạp; theo dõi tiến độ học tập, kỹ năng và lịch sử submission; tham gia cuộc thi có giới hạn thời gian; hệ thống điểm, rating, bảng xếp hạng, huy hiệu, thành tích; học theo lộ trình, chủ đề và mức độ khó; AI tutor hỗ trợ gợi ý phân tầng không tiết lộ lời giải; tham gia nhóm học tập, thảo luận và mock interview. Xây dựng theo mô hình Full-Stack Web App, sử dụng Bun runtime và Neon Serverless PostgreSQL."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - In-Browser Problem Solving & Instant Code Execution (Priority: P1)

As an aspiring software developer practicing algorithms, I want to browse structured algorithm problems, write JavaScript solutions in an interactive in-browser code editor, and run my code against public test cases instantly without network delays or server wait queues, so that I can rapidly test, iterate, and verify my logic locally.

**Why this priority**: Core execution functionality is the absolute foundational value proposition of the platform. Without an interactive editor and an in-browser code runner that can execute code safely and return outputs, no other learning or competitive features can function.

**Independent Test**: A user can navigate to a problem (e.g., "Two Sum"), write a solution, click "Run Code", and within 200 milliseconds view the formatted console outputs, returned values, and public test case assertions directly in their browser.

**Acceptance Scenarios**:

1. **Given** a user is on an algorithm problem page with predefined starter code, **When** they edit the solution and click "Run Code", **Then** the browser executes the code against all visible public test cases in an isolated worker context and displays the execution verdict (Pass/Fail) and output for each case.
2. **Given** user code contains `console.log` statements, **When** the code executes, **Then** all standard output logs are captured and displayed in the execution output panel separated by test case without corrupting the test assertions.
3. **Given** user code contains an intentional or accidental infinite loop (e.g., `while (true) {}`), **When** execution duration exceeds the safety threshold (2000 milliseconds), **Then** the execution environment is terminated automatically, the main user interface remains completely responsive, and the user receives a clear "Time Limit Exceeded" notification.

---

### User Story 2 - Code Submission & Test Suite Verification (Priority: P1)

As a learner, I want to submit my completed solution to be evaluated against a comprehensive test suite (including hidden edge cases, boundary values, and large inputs), so that I can prove the correctness of my algorithm, record my submission history, and mark the problem as solved.

**Why this priority**: Solving problems requires definitive verification beyond basic public test cases to catch edge cases (empty arrays, negative numbers, overflow) and record authenticated learner achievement.

**Independent Test**: A user submits a solution; the system runs all hidden test cases, records the verdict, duration, and memory estimate, persists the submission record in the database, and updates the problem status to "Solved" if all cases pass.

**Acceptance Scenarios**:

1. **Given** a user solution that passes all public and hidden test cases, **When** they click "Submit", **Then** the system marks the submission as "Accepted", records the submission timestamp and code, and displays the execution summary (runtime, memory).
2. **Given** a user solution that fails on a hidden test case, **When** they click "Submit", **Then** the system marks the submission as "Wrong Answer", highlights the first failing test case input and expected vs. actual output (unless designated as a completely confidential contest test), and saves the failed submission to the user's history.
3. **Given** user code that triggers a syntax error or uncaught runtime exception, **When** submitted or run, **Then** the system catches the error, sanitizes internal system stack frames, highlights the exact line and column in the user's code editor, and presents a user-friendly error message.

---

### User Story 3 - Code Quality, Static AST & Complexity Analysis (Priority: P2)

As an algorithm student, I want to receive actionable feedback on my code's structural quality and time/space complexity, so that I can learn optimal coding practices and understand whether my solution meets optimal Big-O requirements.

**Why this priority**: Simply getting an "Accepted" verdict does not teach algorithmic efficiency. Learners need feedback on whether their solution is $O(N^2)$ or $O(N)$ and if they have anti-patterns such as redundant nested iterations.

**Independent Test**: When a user runs code, the system performs in-browser static syntax analysis and empirical multi-size input profiling, identifying loop nesting depths, recursion patterns, and estimating Big-O time complexity.

**Acceptance Scenarios**:

1. **Given** user code with nested loops traversing an input collection, **When** analysis runs, **Then** the system identifies the loop depth (e.g., depth 2) and displays an estimated time complexity warning (e.g., "Potential $O(N^2)$ detected; optimal solution is $O(N)$").
2. **Given** user code utilizing recursive function calls without base-case guarantees, **When** analysis runs, **Then** the system flags recursion depth and space stack overhead.
3. **Given** benchmark inputs of varying scale ($N=10, 100, 1000, 10000$), **When** benchmark profiling runs, **Then** the system measures empirical runtime scaling and renders a runtime growth curve comparing the user's solution against optimal benchmarks.

---

### User Story 4 - Structured Curriculum, Skill Tree & Progress Tracking (Priority: P2)

As a learner following a career preparation journey, I want to follow a directed skill tree with prerequisite topics (e.g., Arrays $\rightarrow$ Two Pointers $\rightarrow$ Stacks $\rightarrow$ Trees $\rightarrow$ Graphs $\rightarrow$ Dynamic Programming) while also having access to a flexible problem library with tag and difficulty filters, so that I have a clear learning path and visibility into my skill mastery.

**Why this priority**: Clear pedagogical progression prevents learner overwhelm and directs students toward building foundational skills before tackling advanced algorithmic paradigms.

**Independent Test**: A learner can view their Skill Radar Chart, inspect unlocked and locked topic nodes in the Skill Tree, select recommended next challenges based on unfinished prerequisites, and view their completion percentage across topics.

**Acceptance Scenarios**:

1. **Given** a learner viewing the DSA Skill Tree, **When** they have completed the required foundational problems in "Arrays & Hashing", **Then** the dependent node "Two Pointers" unlocks, visually highlighting newly available challenges.
2. **Given** a learner browsing the Problem Library, **When** they filter by difficulty ("Easy", "Medium", "Hard"), topic ("Linked List", "Binary Search"), and status ("Unsolved", "Solved", "Attempted"), **Then** the catalog displays matching problems with clear completion indicators.
3. **Given** a learner viewing their profile, **When** they open the Skill Profile dashboard, **Then** an interactive radar chart displays their mastery index across core domains (e.g., Data Structures, Sorting, Searching, Graphs, Dynamic Programming) calculated from their accepted submissions.

---

### User Story 5 - Socratic AI Tutor Assistance (Priority: P3)

As a student struggling with an algorithm challenge, I want to ask an AI tutor for conceptual hints, edge-case reminders, and Socratic guiding questions without receiving the direct solution or spoiler code, so that I develop genuine problem-solving autonomy.

**Why this priority**: Learners frequently abandon practice when stuck on a test case or concept. Providing progressive, non-spoiling hints keeps learners engaged and builds critical thinking.

**Independent Test**: A user requests a hint on a problem; the AI tutor analyzes their current code and test failure, and delivers a level-1 conceptual nudge without printing code or full algorithms.

**Acceptance Scenarios**:

1. **Given** a learner whose solution fails on an edge case, **When** they request a "Level 1 Hint", **Then** the AI tutor asks a targeted diagnostic question (e.g., "What should your function return if the input array is empty or contains only one element?") without writing any code.
2. **Given** a learner who is still unable to solve the problem after a Level 1 hint, **When** they request a "Level 2 Hint", **Then** the AI tutor suggests an algorithmic pattern or data structure (e.g., "Consider using a Hash Map to achieve $O(1)$ lookups instead of scanning the array repeatedly").
3. **Given** any hint request, **When** the AI tutor formats its response, **Then** direct code answers or copy-pasteable implementations are strictly prohibited from appearing in the output.

---

### User Story 6 - Timed Contests, Rating System & Gamification (Priority: P3)

As a competitive programmer, I want to register for and participate in scheduled, time-limited coding contests, solve a problem set against the clock, earn rating points based on performance, and climb the leaderboard, so that I can evaluate my skills against peers.

**Why this priority**: Gamification, peer competition, ratings, and time constraints simulate interview pressure and boost long-term retention.

**Independent Test**: A user registers for a contest, submits solutions during the active contest window, receives scored penalties for wrong submissions, and sees their updated rating and leaderboard ranking when the contest concludes.

**Acceptance Scenarios**:

1. **Given** an active contest, **When** a participant submits a correct solution, **Then** their score increases based on problem point value, and penalty time is calculated based on elapsed contest minutes and prior rejected submissions.
2. **Given** a concluded contest, **When** official standings are calculated, **Then** participant rating points are updated using a competitive rating algorithm (e.g., Elo/Glicko variant) and new achievement badges are awarded.
3. **Given** a user viewing their public profile, **When** they view their achievements, **Then** their contest rating graph, global rank, and earned badges (e.g., "7-Day Streak", "Graph Master", "Top 10% Contestant") are prominently displayed.

---

### User Story 7 - Community Discussions & Peer Mock Interviews (Priority: P4)

As a learner preparing for technical job interviews, I want to discuss alternative problem solutions with markdown and code formatting, and schedule peer mock interviews with shared editor synchronization, so that I can articulate technical thoughts and learn alternative paradigms from other developers.

**Why this priority**: Communication and collaborative review reflect realistic workplace expectations and solidify deep understanding.

**Independent Test**: Users can post structured solution walk-throughs in the problem discussion forum with syntax-highlighted code blocks, upvote helpful explanations, and initiate peer mock interview rooms.

**Acceptance Scenarios**:

1. **Given** a solved problem, **When** a user navigates to the "Discussions" tab, **Then** they can view community solutions tagged by approach (e.g., "Two-Pointer $O(N)$", "Brute Force $O(N^2)$") with community upvotes.
2. **Given** two users entering a Mock Interview room, **When** either user types in the collaborative editor, **Then** code changes and cursor positions synchronize in real time, accompanied by a shared problem description and timer.

---

### Edge Cases

- **Infinite Loops & Memory Exhaustion**: User code with unbounded recursion (`Maximum call stack size exceeded`) or unbounded memory allocation (e.g., infinite array growth) must be caught by client execution bounds and terminated within 2000ms without crashing the browser tab.
- **Console Hijacking & Prototype Mutation**: User code attempting to overwrite core prototypes (e.g., `Array.prototype.push = null`) or suppress standard output must be evaluated in a clean execution context so successive runs and other tests remain untainted.
- **Deep Object & Cyclic Structure Comparison**: Test assertions comparing objects with cyclic references or complex nested structures must use robust deep-equality algorithms that terminate and report readable diffs.
- **Asynchronous Code Handling**: User submissions returning unresolved Promises or invoking asynchronous timers (`setTimeout`, `setInterval`) must either be resolved cleanly within the execution timeout or flagged with clear asynchronous constraint notifications.
- **Network Interruption During Contest**: If a user's network temporarily disconnects during a contest, their local editor state must persist in browser storage, allowing submission upon reconnection without loss of written code.
- **Empty & Extreme Input Boundaries**: Problems must include tests with $N = 0$, $N = 1$, maximum integer boundaries, negative values, and duplicate elements to verify algorithm correctness.

---

## Requirements *(mandatory)*

### Functional Requirements

#### In-Browser Execution & Editor
- **FR-001**: System MUST provide an interactive, syntax-highlighted code editor supporting JavaScript (ES2022+ syntax) with auto-closing brackets, line numbering, code indentation, and error line indicators.
- **FR-002**: System MUST execute user JavaScript code entirely within an isolated in-browser Web Worker, ensuring the main browser user interface remains fully responsive during computation.
- **FR-003**: System MUST enforce an execution time limit (default 2000 milliseconds) per test run, automatically terminating any execution that exceeds this limit and returning a "Time Limit Exceeded" status.
- **FR-004**: System MUST capture all standard output and error streams (`console.log`, `console.warn`, `console.error`) emitted during execution and map them to their corresponding test case run.
- **FR-005**: System MUST compare actual execution return values against expected test case outputs using deep structural equality, producing structured pass/fail verdicts with input/output diffs.
- **FR-006**: System MUST parse and sanitize runtime error stack traces, stripping away internal worker wrappers to present accurate user code line and column references.

#### Code Analysis & Complexity
- **FR-007**: System MUST perform in-browser static Abstract Syntax Tree (AST) analysis on submitted JavaScript code to detect structural characteristics: nested loop depths, recursive calls, and syntax errors.
- **FR-008**: System MUST highlight syntax errors and anti-pattern warnings directly as line annotations inside the code editor.
- **FR-009**: System MUST execute multi-size benchmark inputs ($N=10, 100, 1000, 10000$) to calculate empirical execution time scaling and estimate Big-O computational growth.

#### Curriculum, Problems & Progress
- **FR-010**: System MUST maintain a structured problem catalog categorized by:
  - Difficulty: Easy, Medium, Hard
  - Topics: Arrays & Hashing, Two Pointers, Sliding Window, Stack, Binary Search, Linked List, Trees, Tries, Heap / Priority Queue, Backtracking, Graphs, Advanced Graphs, 1D Dynamic Programming, 2D Dynamic Programming, Greedy, Intervals, Math & Geometry, Bit Manipulation.
- **FR-011**: System MUST support a directed acyclic graph (DAG) Skill Tree where foundational topics serve as prerequisites for advanced topics.
- **FR-012**: System MUST persist user submission records including code, language, status, execution duration, estimated memory, and passed test cases.
- **FR-013**: System MUST compute and display an aggregate Skill Radar Chart representing learner proficiency across algorithm categories based on accepted submissions.
- **FR-014**: System MUST calculate learner learning streaks (consecutive days with at least one accepted submission) and update user statistics upon submission.

#### AI Pedagogical Tutor
- **FR-015**: System MUST provide an interactive AI Tutor interface within the problem-solving workspace.
- **FR-016**: System MUST enforce a tiered Socratic hint system:
  - Level 1: Clarifying problem constraints and edge-case reminders.
  - Level 2: High-level conceptual strategy and data structure recommendation.
  - Level 3: Pseudocode or algorithmic flow breakdown.
- **FR-017**: AI Tutor responses MUST NOT provide completed production code or direct copy-paste solutions to the user.

#### Contests, Rating & Community
- **FR-018**: System MUST support scheduled, time-bounded coding contests with countdown timers, active participation periods, and automated lockouts upon expiration.
- **FR-019**: System MUST score contest submissions based on problem weight and apply time penalties for incorrect submissions prior to acceptance.
- **FR-020**: System MUST recalculate user competitive ratings after contest finalization using a skill rating algorithm and display historical rating charts on user profiles.
- **FR-021**: System MUST maintain a global leaderboard and contest-specific leaderboards ranking users by rating and solved problems.
- **FR-022**: System MUST provide a solution discussion forum per problem where users can share write-ups, categorize by time/space complexity, and upvote constructive discussions.

---

### Key Entities *(include if feature involves data)*

- **User**: Represents a learner or contestant. Attributes: unique ID, username, email, avatar, competitive rating, streak count, total solved count, created date.
- **Problem**: Represents a coding challenge. Attributes: unique ID, slug, title, description (Markdown), difficulty (Easy/Medium/Hard), topic categories, starter code template, function signature, public test cases, hidden test cases, benchmark test cases, hints, author ID.
- **TestCase**: Represents an evaluation unit for a problem. Attributes: input parameters, expected output, isPublic flag, explanation, execution timeout override.
- **Submission**: Represents a user's code execution attempt. Attributes: unique ID, userId, problemId, code, status (Accepted, Wrong Answer, Time Limit Exceeded, Runtime Error, Compile/Syntax Error), runtimeMs, memoryBytes, passedTestCasesCount, totalTestCasesCount, testResultsDetail (JSON), submittedAt.
- **SkillNode**: Represents a topic in the curriculum Skill Tree. Attributes: unique ID, topicName, description, icon, prerequisiteNodeIds (DAG links), requiredProblemCount, orderIndex.
- **Contest**: Represents a competitive event. Attributes: unique ID, title, description, startTime, endTime, problemList (with point weights), registrationList, status (Upcoming, Ongoing, Finished).
- **ContestParticipation**: Represents a user's participation in a contest. Attributes: contestId, userId, score, totalPenaltyMinutes, submissionsList, rank, ratingDelta.
- **AchievementBadge**: Represents a gamification award. Attributes: unique ID, title, description, badgeIcon, criteriaType (e.g., streak, solveCount, ratingMilestone), unlockedAt.
- **DiscussionPost**: Represents a solution or query in the community forum. Attributes: unique ID, problemId, authorId, title, content (Markdown), upvoteCount, tags, createdAt.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users receive test execution feedback for public test cases in under **200 milliseconds** when running solutions on standard desktop and mobile browsers, with zero server execution latency.
- **SC-002**: 100% of infinite loops or runaway scripts in user code are safely terminated within **2000 milliseconds** ($\pm 100\text{ ms}$) without freezing the user interface or crashing the browser tab.
- **SC-003**: 95% of syntax errors and runtime exceptions produce clear, user-friendly diagnostic messages with exact code line pointers instead of raw browser engine stack traces.
- **SC-004**: Users can navigate the entire core learning flow—from selecting a problem in the Skill Tree, writing code, executing public tests, to viewing pass/fail status—in under **3 minutes** on their first visit.
- **SC-005**: 90% of user-submitted code in the Problem Library receives accurate empirical Big-O classification ($O(1), O(\log N), O(N), O(N \log N), O(N^2)$) aligned with theoretical algorithmic performance.
- **SC-006**: AI Tutor requests deliver pedagogical guidance within **3 seconds** without exposing raw code solutions in over 99% of tutor interactions.
- **SC-007**: The platform supports concurrent contest participation of at least **1,000 active contestants** submitting solutions simultaneously without submission data loss or leaderboard calculation lag exceeding 5 seconds.
- **SC-008**: User completion rates for multi-step DSA roadmap tracks increase by at least **25%** compared to traditional unstructured problem lists due to prerequisite unlocking and visual radar mastery feedback.

---

## Assumptions

- **Target Audience**: Students, self-taught developers, and software engineering candidates practicing for technical interviews and competitive programming.
- **Primary Programming Language**: JavaScript (Node.js/ES2022+ compatible environment) is the initial designated language for all problem templates, test suites, and in-browser execution.
- **Execution Sandboxing Model**: Code execution is performed 100% client-side inside standard browser Web Workers. No backend server execution clusters (e.g., Judge0 or Docker containers) are required for executing user JavaScript code in this phase.
- **Runtime & Deployment Platform**: The platform is developed with Bun runtime compatibility and deployed on serverless hosting infrastructure (Vercel).
- **Database Service**: The platform utilizes Neon Serverless PostgreSQL as its relational database provider (provisioned via Vercel integration, with connection credentials provided via environment variables such as `DATABASE_URL`).
- **Network Resilience**: In the event of temporary internet disconnection, the code editor caches working code locally so work is never lost. Remote network connectivity is only required for initial page loads, database synchronization, and contest score submissions.
- **AI Service Provider**: AI Tutor capabilities utilize an external LLM API (such as Gemini/OpenAI) using structured system prompts designed for Socratic guidance and strict anti-solution guardrails.
- **Authentication**: User authentication will be handled via standard session/OAuth providers (e.g., GitHub and Google OAuth) compatible with the serverless environment.
- **Self-Contained Integrity**: This specification is fully self-contained and captures all domain concepts, requirements, and user journeys independently of external conversational history.
