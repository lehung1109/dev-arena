"use client";

import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Repeat,
  Layers,
  Lightbulb,
  AlertOctagon,
  Info,
} from "lucide-react";
import type { ASTAnalysisMetrics } from "@/types/runner";
import type { ExtendedASTAnalysisMetrics } from "@/lib/analysis/ast-analyzer";

export interface AstWarningsListProps {
  metrics: ASTAnalysisMetrics | null;
  isLoading?: boolean;
}

export const AstWarningsList: React.FC<AstWarningsListProps> = ({
  metrics,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#0a0f1a] p-4 text-center text-slate-500 text-xs">
        Analyzing Abstract Syntax Tree (AST)...
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="rounded-xl border border-dashed border-slate-800 bg-[#0a0f1a] p-4 text-center text-slate-500 text-xs">
        Run or submit code to trigger static AST inspection.
      </div>
    );
  }

  const { maxLoopDepth, hasRecursion, syntaxValid, syntaxErrors, structuralWarnings } = metrics;
  const extMetrics = metrics as ExtendedASTAnalysisMetrics;
  const warningLocations = extMetrics.warningLocations || [];

  const getDepthBadge = (depth: number) => {
    if (depth === 0) {
      return {
        label: "Depth 0 (O(1))",
        color: "bg-slate-800 text-slate-300 border-slate-700",
      };
    }
    if (depth === 1) {
      return {
        label: "Depth 1 (O(N))",
        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      };
    }
    if (depth === 2) {
      return {
        label: "Depth 2 (O(N^2))",
        color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      };
    }
    return {
      label: `Depth ${depth} (O(N^${depth}))`,
      color: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    };
  };

  const depthBadge = getDepthBadge(maxLoopDepth);

  // Generate actionable optimization tips based on AST structure
  const getOptimizationTips = () => {
    const tips: string[] = [];
    if (maxLoopDepth >= 2) {
      tips.push(
        "Nested loop detected: Evaluate whether a Hash Map (O(1) lookups), Two Pointers, or Sliding Window can reduce time complexity to O(N)."
      );
    }
    if (hasRecursion) {
      tips.push(
        "Recursion in use: Check whether recursion branch calls overlap. If subproblems repeat, incorporate memoization (Top-Down DP) or convert to iterative Tabulation."
      );
    }
    if (maxLoopDepth === 1 && !hasRecursion) {
      tips.push(
        "Linear iteration: Single pass detected. Optimal for linear scanning algorithms."
      );
    }
    return tips;
  };

  const tips = getOptimizationTips();

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0a0f1a] p-4 text-slate-200 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Static AST Analysis &amp; Warnings
          </h3>
        </div>

        {/* Syntax status */}
        {syntaxValid ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
            <CheckCircle2 className="h-3 w-3" />
            <span>Syntax Valid</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded">
            <AlertOctagon className="h-3 w-3" />
            <span>Syntax Error</span>
          </span>
        )}
      </div>

      {/* Metric Indicators */}
      <div className="grid grid-cols-2 gap-3">
        {/* Loop Depth Badge */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-3">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">
            Max Loop Depth
          </span>
          <span
            className={`inline-block px-2.5 py-0.5 rounded text-xs font-mono font-semibold border ${depthBadge.color}`}
          >
            {depthBadge.label}
          </span>
        </div>

        {/* Recursion Badge */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-3">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">
            Recursion Pattern
          </span>
          {hasRecursion ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-semibold border bg-amber-500/10 text-amber-400 border-amber-500/30">
              <Repeat className="h-3 w-3" />
              <span>Detected</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-semibold border bg-slate-800 text-slate-400 border-slate-700">
              <span>None</span>
            </span>
          )}
        </div>
      </div>

      {/* Syntax Errors List */}
      {syntaxErrors && syntaxErrors.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
            Syntax Errors:
          </div>
          <div className="space-y-1.5">
            {syntaxErrors.map((err, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2.5 rounded-lg border border-rose-500/30 bg-rose-950/20 text-xs text-rose-200 font-mono"
              >
                <AlertOctagon className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-rose-400">
                    [Line {err.line}, Col {err.column}]:
                  </span>{" "}
                  {err.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Structural & Code Quality Warnings */}
      {structuralWarnings && structuralWarnings.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
            Structural Warnings:
          </div>
          <div className="space-y-1.5">
            {structuralWarnings.map((warning, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2.5 rounded-lg border border-amber-500/30 bg-amber-950/20 text-xs text-amber-200"
              >
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimization Tips */}
      {tips.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
            <span>Algorithm Quality Tips:</span>
          </div>
          <div className="space-y-1.5">
            {tips.map((tip, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2.5 rounded-lg border border-blue-500/20 bg-blue-950/10 text-xs text-slate-300 leading-relaxed"
              >
                <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
