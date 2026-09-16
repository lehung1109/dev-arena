"use client";

import React, { useState } from "react";
import type { SkillCategoryMastery } from "@/lib/curriculum/skill-graph";

interface SkillRadarChartProps {
  categories: SkillCategoryMastery[];
  size?: number;
  className?: string;
}

export function SkillRadarChart({
  categories,
  size = 380,
  className = "",
}: SkillRadarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!categories || categories.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-[#0c121e] p-6 text-sm text-slate-500">
        No mastery data available.
      </div>
    );
  }

  const numAxes = categories.length;
  const center = size / 2;
  const radius = size * 0.34;
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Helper to compute (x, y) for a given axis index and fractional distance (0 to 1)
  const getCoordinates = (index: number, fraction: number) => {
    // Start at 12 o'clock (-pi/2) and rotate clockwise
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / numAxes;
    const x = center + fraction * radius * Math.cos(angle);
    const y = center + fraction * radius * Math.sin(angle);
    return { x, y, angle };
  };

  // Generate data polygon points
  const dataPoints = categories.map((cat, idx) => {
    const fraction = Math.min(1, Math.max(0.05, cat.score / 100));
    return getCoordinates(idx, fraction);
  });
  const dataPolygonString = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // Overall average mastery
  const avgScore = Math.round(
    categories.reduce((acc, curr) => acc + curr.score, 0) / categories.length
  );

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          <defs>
            {/* Radar area gradient */}
            <linearGradient id="radarFillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.25" />
            </linearGradient>
            <radialGradient id="radarCenterGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0c121e" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background center glow */}
          <circle cx={center} cy={center} r={radius} fill="url(#radarCenterGlow)" />

          {/* Concentric grid rings */}
          {rings.map((ringFraction, ringIdx) => {
            const ringPoints = categories
              .map((_, i) => {
                const { x, y } = getCoordinates(i, ringFraction);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(" ");

            return (
              <g key={ringIdx}>
                <polygon
                  points={ringPoints}
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray={ringFraction === 1.0 ? "none" : "2 3"}
                />
                {/* Ring percentage label on vertical axis */}
                <text
                  x={center + 6}
                  y={center - ringFraction * radius + 4}
                  fill="#475569"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {Math.round(ringFraction * 100)}%
                </text>
              </g>
            );
          })}

          {/* Spoke lines from center to outer ring */}
          {categories.map((_, idx) => {
            const { x, y } = getCoordinates(idx, 1.0);
            return (
              <line
                key={idx}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#1e293b"
                strokeWidth="1"
              />
            );
          })}

          {/* Radar data polygon */}
          <polygon
            points={dataPolygonString}
            fill="url(#radarFillGradient)"
            stroke="#60a5fa"
            strokeWidth="2.5"
            className="transition-all duration-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
          />

          {/* Vertex dots */}
          {dataPoints.map((point, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? 7 : 4.5}
                  fill={isHovered ? "#93c5fd" : "#3b82f6"}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? "2.5" : "1.5"}
                  className="transition-all duration-150"
                />
              </g>
            );
          })}

          {/* Category Axis Labels */}
          {categories.map((cat, idx) => {
            const { x, y, angle } = getCoordinates(idx, 1.22);
            const isHovered = hoveredIndex === idx;

            // Align text cleanly based on angle
            const cos = Math.cos(angle);
            let textAnchor: "middle" | "start" | "end" = "middle";
            if (cos > 0.3) textAnchor = "start";
            else if (cos < -0.3) textAnchor = "end";

            return (
              <g
                key={idx}
                className="cursor-pointer transition-colors duration-150"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <text
                  x={x}
                  y={y}
                  textAnchor={textAnchor}
                  dominantBaseline="central"
                  fontSize={isHovered ? "12" : "11"}
                  fontWeight={isHovered ? "700" : "600"}
                  fill={isHovered ? "#93c5fd" : "#cbd5e1"}
                  className="select-none transition-all"
                >
                  {cat.category}
                </text>
                <text
                  x={x}
                  y={y + 13}
                  textAnchor={textAnchor}
                  dominantBaseline="central"
                  fontSize="10"
                  fontFamily="monospace"
                  fill={isHovered ? "#60a5fa" : "#64748b"}
                  className="select-none transition-all"
                >
                  {cat.score}% ({cat.solvedCount}/{cat.totalCount})
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIndex !== null && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none rounded-lg border border-blue-500/40 bg-slate-900/95 px-3 py-1.5 shadow-xl backdrop-blur text-center text-xs">
            <span className="font-semibold text-white">
              {categories[hoveredIndex].category}
            </span>
            <div className="text-blue-400 font-mono text-[11px] mt-0.5">
              Score: {categories[hoveredIndex].score}% | Solved:{" "}
              {categories[hoveredIndex].solvedCount} / {categories[hoveredIndex].totalCount}
            </div>
          </div>
        )}
      </div>

      {/* Footer Metrics */}
      <div className="mt-2 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1 border border-slate-700/60">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-slate-400">DSA Mastery:</span>
          <span className="font-bold font-mono text-white">{avgScore}%</span>
        </div>
      </div>
    </div>
  );
}
