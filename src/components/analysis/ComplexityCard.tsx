"use client";

import React from "react";
import {
  TrendingUp,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Play,
  Loader2,
} from "lucide-react";
import type { BenchmarkPoint } from "@/types/runner";

export interface ComplexityCardProps {
  estimatedBigO?: string;
  optimalBigO?: string;
  confidence?: number;
  explanation?: string;
  benchmarkPoints?: BenchmarkPoint[];
  isLoading?: boolean;
  onRunBenchmark?: () => void;
}

export const ComplexityCard: React.FC<ComplexityCardProps> = ({
  estimatedBigO,
  optimalBigO = "O(N)",
  confidence = 0.85,
  explanation,
  benchmarkPoints = [],
  isLoading = false,
  onRunBenchmark,
}) => {
  const getBigOBadgeClass = (bigO?: string) => {
    if (!bigO) return "bg-slate-800 text-slate-400 border-slate-700";
    if (bigO === "O(1)" || bigO === "O(log N)") {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
    if (bigO === "O(N)" || bigO === "O(N log N)") {
      return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    }
    if (bigO === "O(N^2)") {
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    }
    return "bg-rose-500/10 text-rose-400 border-rose-500/30";
  };

  const isOptimal =
    estimatedBigO && optimalBigO
      ? estimatedBigO === optimalBigO ||
        (optimalBigO === "O(N)" && (estimatedBigO === "O(1)" || estimatedBigO === "O(log N)"))
      : true;

  // Compute SVG chart scaling for benchmarkPoints
  const maxDuration =
    benchmarkPoints.length > 0
      ? Math.max(...benchmarkPoints.map((p) => p.durationMs), 0.1)
      : 1;

  const chartHeight = 110;
  const chartWidth = 320;
  const paddingX = 35;
  const paddingY = 20;

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0a0f1a] p-4 text-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Complexity &amp; Runtime Profiler
          </h3>
        </div>

        {onRunBenchmark && (
          <button
            type="button"
            onClick={onRunBenchmark}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Benchmarking...</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 fill-current" />
                <span>Re-profile</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Complexity Badges */}
      <div className="grid grid-cols-2 gap-3 my-3.5">
        {/* Estimated Big-O */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-3">
          <div className="text-[11px] font-medium text-slate-400 mb-1 flex items-center justify-between">
            <span>Estimated Time</span>
            <span className="text-[10px] text-slate-500 font-mono">
              {Math.round(confidence * 100)}% conf.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded text-sm font-mono font-bold border ${getBigOBadgeClass(
                estimatedBigO
              )}`}
            >
              {estimatedBigO || "Pending"}
            </span>
            {estimatedBigO && (
              <span className="text-xs">
                {isOptimal ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Optimal Big-O Target */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-3">
          <div className="text-[11px] font-medium text-slate-400 mb-1">
            <span>Target / Optimal</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded text-sm font-mono font-bold border ${getBigOBadgeClass(
                optimalBigO
              )}`}
            >
              {optimalBigO}
            </span>
            <Zap className="h-3.5 w-3.5 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Explanation text if present */}
      {explanation && (
        <div className="rounded-md bg-slate-950/60 border border-slate-800/60 p-2.5 mb-3 text-xs text-slate-400 leading-relaxed font-sans">
          <div className="flex items-start gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
            <span>{explanation}</span>
          </div>
        </div>
      )}

      {/* Empirical Multi-N Runtime Chart */}
      {benchmarkPoints.length > 0 ? (
        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-medium">Empirical Runtime Curve:</span>
            <span className="font-mono text-[10px] text-slate-500">
              Peak: {maxDuration.toFixed(2)}ms
            </span>
          </div>

          {/* SVG Line / Bar Visualization */}
          <div className="rounded-lg bg-slate-950 p-2 border border-slate-800/80 flex items-center justify-center overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full max-w-[340px] h-28 overflow-visible font-mono text-[9px]"
            >
              {/* Grid lines */}
              <line
                x1={paddingX}
                y1={chartHeight - paddingY}
                x2={chartWidth - 10}
                y2={chartHeight - paddingY}
                stroke="#334155"
                strokeWidth="1"
              />
              <line
                x1={paddingX}
                y1={paddingY}
                x2={chartWidth - 10}
                y2={paddingY}
                stroke="#1e293b"
                strokeDasharray="2,2"
                strokeWidth="1"
              />

              {/* Y-axis labels */}
              <text
                x={paddingX - 4}
                y={paddingY + 3}
                fill="#64748b"
                textAnchor="end"
              >
                {maxDuration.toFixed(1)}ms
              </text>
              <text
                x={paddingX - 4}
                y={chartHeight - paddingY + 3}
                fill="#64748b"
                textAnchor="end"
              >
                0ms
              </text>

              {/* Render Benchmark Bars & Points */}
              {benchmarkPoints.map((point, idx) => {
                const availableWidth = chartWidth - paddingX - 20;
                const step =
                  benchmarkPoints.length > 1
                    ? availableWidth / (benchmarkPoints.length - 1)
                    : availableWidth / 2;
                const x = paddingX + idx * step;
                const availableHeight = chartHeight - paddingY * 2;
                const normalizedHeight =
                  (Math.max(point.durationMs, 0.05) / maxDuration) * availableHeight;
                const y = chartHeight - paddingY - normalizedHeight;

                return (
                  <g key={idx} className="group">
                    {/* Bar from baseline */}
                    <rect
                      x={x - 6}
                      y={y}
                      width={12}
                      height={Math.max(normalizedHeight, 2)}
                      fill="#3b82f6"
                      fillOpacity={0.5}
                      rx={2}
                      className="transition-all hover:fill-opacity-80"
                    />
                    {/* Node point */}
                    <circle
                      cx={x}
                      cy={y}
                      r={3.5}
                      fill="#60a5fa"
                      stroke="#1e293b"
                      strokeWidth={1.5}
                    />
                    {/* X-axis N label */}
                    <text
                      x={x}
                      y={chartHeight - 6}
                      fill="#94a3b8"
                      textAnchor="middle"
                    >
                      N={point.inputSize}
                    </text>
                    {/* Duration hover label */}
                    <text
                      x={x}
                      y={Math.max(y - 5, 12)}
                      fill="#38bdf8"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {point.durationMs.toFixed(1)}ms
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-800 p-4 text-center text-slate-500 text-xs">
          <HelpCircle className="h-5 w-5 mx-auto mb-1 text-slate-600" />
          <span>Click &quot;Run&quot; or &quot;Submit&quot; to execute multi-N empirical profiling.</span>
        </div>
      )}
    </div>
  );
};
