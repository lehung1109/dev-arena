import Link from "next/link";
import { SEED_PROBLEMS } from "@/lib/db/seeds/seed-problems";
import { ArrowRight, Code2, Tag } from "lucide-react";

export const metadata = {
  title: "Algorithm Problems Catalog | Dev Arena",
  description: "Browse curated Data Structures & Algorithms challenges with zero-lag in-browser execution.",
};

export default function ProblemsCatalogPage() {
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Code2 className="w-8 h-8 text-blue-500" />
          <span>Problem Catalog</span>
        </h1>
        <p className="mt-2 text-slate-400 text-sm">
          Select a problem to enter the live in-browser execution arena powered by isolated Web Workers.
        </p>
      </div>

      {/* Problems List */}
      <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-[#0c121e] overflow-hidden shadow-xl">
        {SEED_PROBLEMS.map((problem, idx) => (
          <div
            key={problem.slug}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-800/40 transition-colors gap-4"
          >
            <div className="flex items-start gap-4">
              <span className="font-mono text-sm text-slate-500 font-semibold w-6 pt-0.5">
                {idx + 1}.
              </span>
              <div>
                <div className="flex items-center gap-3">
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
                </div>

                {/* Topic tags */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {problem.topicTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300 border border-slate-700/50"
                    >
                      <Tag className="h-2.5 w-2.5 text-blue-400" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="flex items-center self-end sm:self-center">
              <Link
                href={`/problems/${problem.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all shadow-md shadow-blue-600/20 active:scale-95"
              >
                <span>Solve Problem</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
