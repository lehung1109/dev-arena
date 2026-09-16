"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Code2,
  Search,
  CheckCircle2,
  Circle,
  Tag,
  ArrowRight,
  Filter,
  X,
  Sparkles,
  Flame,
  Layers,
} from "lucide-react";
import { getAllCatalogProblems, type CatalogProblem } from "@/lib/curriculum/problems-catalog";

const ALL_TOPICS = [
  "All Topics",
  "Arrays",
  "Hash Table",
  "Two Pointers",
  "Binary Search",
  "Sliding Window",
  "Linked List",
  "Trees",
  "Dynamic Programming",
  "Graphs",
  "Heap",
  "String",
  "Stack",
];

function ProblemLibraryContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get("topic") || "All Topics";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopic);
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "SOLVED" | "UNSOLVED">("ALL");
  const [solvedSlugs, setSolvedSlugs] = useState<Set<string>>(new Set());
  const [loadingSolved, setLoadingSolved] = useState(true);

  // Sync topic from query param if changed
  useEffect(() => {
    const topicParam = searchParams.get("topic");
    if (topicParam) {
      // Find matching topic (case-insensitive or exact)
      const matched = ALL_TOPICS.find(
        (t) => t.toLowerCase() === topicParam.toLowerCase() || topicParam.toLowerCase().includes(t.toLowerCase())
      );
      if (matched) {
        setSelectedTopic(matched);
      }
    }
  }, [searchParams]);

  // Fetch solved problems from submissions API
  useEffect(() => {
    async function fetchSolved() {
      try {
        const res = await fetch("/api/submissions?status=ACCEPTED&limit=200");
        if (res.ok) {
          const data = await res.json();
          if (data.items && Array.isArray(data.items)) {
            const solved = new Set<string>();
            for (const item of data.items) {
              const slug = (item.problemId || "").replace(/^seed-/, "");
              if (slug) solved.add(slug);
            }
            setSolvedSlugs(solved);
          }
        }
      } catch (e) {
        console.warn("Could not fetch user solved status:", e);
      } finally {
        setLoadingSolved(false);
      }
    }
    fetchSolved();
  }, []);

  const allProblems = useMemo(() => getAllCatalogProblems(), []);

  // Filter problems based on user selections
  const filteredProblems = useMemo(() => {
    return allProblems.filter((problem) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = problem.title.toLowerCase().includes(q);
        const matchSlug = problem.slug.toLowerCase().includes(q);
        const matchTag = problem.topicTags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchSlug && !matchTag) return false;
      }

      // Difficulty filter
      if (selectedDifficulty !== "ALL" && problem.difficulty !== selectedDifficulty) {
        return false;
      }

      // Topic filter
      if (selectedTopic !== "All Topics") {
        const topicNorm = selectedTopic.toLowerCase();
        const hasTag = problem.topicTags.some(
          (t) => t.toLowerCase().includes(topicNorm) || topicNorm.includes(t.toLowerCase())
        );
        if (!hasTag) return false;
      }

      // Solved status filter
      const isSolved = solvedSlugs.has(problem.slug);
      if (selectedStatus === "SOLVED" && !isSolved) return false;
      if (selectedStatus === "UNSOLVED" && isSolved) return false;

      return true;
    });
  }, [allProblems, searchQuery, selectedDifficulty, selectedTopic, selectedStatus, solvedSlugs]);

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "MEDIUM":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "HARD":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedDifficulty("ALL");
    setSelectedTopic("All Topics");
    setSelectedStatus("ALL");
  };

  const totalSolvedCount = allProblems.filter((p) => solvedSlugs.has(p.slug)).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Problem Library</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Code2 className="w-8 h-8 text-blue-500" />
            <span>Algorithm Challenges</span>
          </h1>
          <p className="mt-1 text-slate-400 text-sm max-w-xl">
            Curated Data Structures &amp; Algorithms challenges with zero-lag in-browser Web Worker
            execution, instant feedback, and AST complexity profiling.
          </p>
        </div>

        {/* Global Solved Counter */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0c121e] px-4 py-2.5 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <div className="text-xs">
              <span className="text-slate-400">Solved: </span>
              <span className="font-mono font-bold text-white">
                {totalSolvedCount} / {allProblems.length}
              </span>
            </div>
          </div>
          <Link
            href="/skills"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Skill Tree</span>
          </Link>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="mb-6 space-y-4 rounded-2xl border border-slate-800 bg-[#0c121e] p-5 shadow-lg">
        {/* Row 1: Search Bar & Difficulty Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search problems by title, tag, or slug..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Difficulty Selector */}
          <div className="flex items-center rounded-xl bg-slate-900/90 border border-slate-800 p-1">
            {["ALL", "EASY", "MEDIUM", "HARD"].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedDifficulty === diff
                    ? diff === "EASY"
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                      : diff === "MEDIUM"
                      ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                      : diff === "HARD"
                      ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                      : "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {diff === "ALL" ? "All Levels" : diff}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Topic Filter & Solved Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-4 text-xs">
          {/* Topic Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Topic:</span>
            </span>
            {ALL_TOPICS.slice(0, 7).map((topic) => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                  selectedTopic === topic
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                    : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {topic}
              </button>
            ))}
            {/* Topic Dropdown for remaining topics */}
            <select
              value={ALL_TOPICS.slice(7).includes(selectedTopic) ? selectedTopic : ""}
              onChange={(e) => {
                if (e.target.value) setSelectedTopic(e.target.value);
              }}
              className="rounded-lg bg-slate-900/60 text-slate-400 border border-slate-800 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
            >
              <option value="" disabled>
                More Topics...
              </option>
              {ALL_TOPICS.slice(7).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Solved Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Status:</span>
            <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
              {(["ALL", "SOLVED", "UNSOLVED"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`rounded px-2.5 py-1 font-semibold transition-all ${
                    selectedStatus === status
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {status === "ALL" ? "All" : status === "SOLVED" ? "Solved" : "Unsolved"}
                </button>
              ))}
            </div>

            {(searchQuery ||
              selectedDifficulty !== "ALL" ||
              selectedTopic !== "All Topics" ||
              selectedStatus !== "ALL") && (
              <button
                onClick={resetFilters}
                className="ml-2 text-xs text-slate-400 hover:text-red-400 transition-colors underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="mb-3 flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong className="text-slate-200 font-mono">{filteredProblems.length}</strong>{" "}
          challenges
          {selectedTopic !== "All Topics" && (
            <span>
              {" "}
              in <strong className="text-blue-400">{selectedTopic}</strong>
            </span>
          )}
        </span>
      </div>

      {/* Problems List Card */}
      <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800 bg-[#0c121e] overflow-hidden shadow-xl">
        {filteredProblems.length === 0 ? (
          <div className="py-16 text-center">
            <Code2 className="mx-auto w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No challenges match your filters</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Try broadening your search keyword, adjusting the difficulty level, or clearing your topic filters.
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          filteredProblems.map((problem, idx) => {
            const isSolved = solvedSlugs.has(problem.slug);

            return (
              <div
                key={problem.slug}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-800/40 transition-colors gap-4"
              >
                <div className="flex items-start gap-4">
                  {/* Solved / Unsolved Indicator */}
                  <div className="pt-1 flex items-center justify-center">
                    {isSolved ? (
                      <span title="Completed">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </span>
                    ) : (
                      <span title="Unsolved">
                        <Circle className="w-5 h-5 text-slate-600" />
                      </span>
                    )}
                  </div>

                  {/* Index */}
                  <span className="font-mono text-sm text-slate-500 font-semibold w-6 pt-0.5">
                    {idx + 1}.
                  </span>

                  <div>
                    {/* Title & Badges */}
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/problems/${problem.slug}`}
                        className="font-semibold text-slate-100 hover:text-blue-400 transition-colors text-base"
                      >
                        {problem.title}
                      </Link>

                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getDifficultyBadge(
                          problem.difficulty
                        )}`}
                      >
                        {problem.difficulty}
                      </span>

                      {/* Acceptance Rate */}
                      <span className="font-mono text-[11px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                        {problem.acceptanceRate}
                      </span>
                    </div>

                    {/* Topic tags */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {problem.topicTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setSelectedTopic(tag)}
                          className="inline-flex items-center gap-1 rounded bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300 border border-slate-700/50 hover:bg-slate-700 transition-colors"
                        >
                          <Tag className="h-2.5 w-2.5 text-blue-400" />
                          <span>{tag}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="flex items-center self-end sm:self-center gap-3">
                  <Link
                    href={`/problems/${problem.slug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95"
                  >
                    <span>{isSolved ? "Solve Again" : "Solve Challenge"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function ProblemsCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-400">
          Loading problem catalog...
        </div>
      }
    >
      <ProblemLibraryContent />
    </Suspense>
  );
}
