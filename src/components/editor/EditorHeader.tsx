"use client";

import React from "react";
import { Play, RotateCcw, Send, Loader2, Code2, Zap } from "lucide-react";

interface EditorHeaderProps {
  problemTitle?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  isRunning: boolean;
  onRun: () => void;
  onSubmit?: () => void;
  onReset: () => void;
  executionTimeMs?: number;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  problemTitle,
  difficulty = "EASY",
  isRunning,
  onRun,
  onSubmit,
  onReset,
  executionTimeMs,
}) => {
  const getDifficultyBadge = () => {
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
    <div className="flex h-12 w-full items-center justify-between border-b border-slate-800 bg-[#0c121e] px-4 text-sm">
      {/* Left side: Language label & problem title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 border border-slate-700/60">
          <Code2 className="h-3.5 w-3.5 text-blue-400" />
          <span>JavaScript (ES2024)</span>
        </div>

        {problemTitle && (
          <span className="hidden lg:inline-block font-medium text-slate-200 truncate max-w-[200px]">
            {problemTitle}
          </span>
        )}

        {difficulty && (
          <span
            className={`hidden sm:inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${getDifficultyBadge()}`}
          >
            {difficulty}
          </span>
        )}
      </div>

      {/* Right side: Reset, Execution metric, Run & Submit buttons */}
      <div className="flex items-center gap-2">
        {executionTimeMs !== undefined && executionTimeMs > 0 && (
          <div className="hidden sm:flex items-center gap-1 text-xs text-emerald-400 mr-2">
            <Zap className="h-3.5 w-3.5" />
            <span className="font-mono">{executionTimeMs}ms</span>
          </div>
        )}

        <button
          type="button"
          onClick={onReset}
          disabled={isRunning}
          title="Reset to starter code"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <button
          type="button"
          onClick={onRun}
          disabled={isRunning}
          className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all hover:border-slate-600 disabled:opacity-50 active:scale-95"
        >
          {isRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current text-emerald-400" />
          )}
          <span>Run Code</span>
          <span className="hidden md:inline-block text-[10px] text-slate-400 font-mono">
            (&lt;200ms)
          </span>
        </button>

        {onSubmit && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isRunning}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 text-xs font-semibold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 active:scale-95"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Submit</span>
          </button>
        )}
      </div>
    </div>
  );
};
