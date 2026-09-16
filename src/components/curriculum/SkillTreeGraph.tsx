"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Layers,
  Split,
  Search,
  Maximize,
  GitCommit,
  GitFork,
  TrendingUp,
  Boxes,
  Network,
  Lock,
  Unlock,
  CheckCircle2,
  ExternalLink,
  X,
  Sparkles,
  Info,
  ArrowRight,
} from "lucide-react";
import type { EvaluatedSkillNode } from "@/lib/curriculum/skill-graph";

interface SkillTreeGraphProps {
  nodes: EvaluatedSkillNode[];
  onSelectNode?: (node: EvaluatedSkillNode) => void;
  className?: string;
}

// Canonical canvas layout coordinates for DAG nodes (Width: 210, Height: 100)
const NODE_COORDINATES: Record<string, { x: number; y: number; tier: number }> = {
  arrays_hashing: { x: 420, y: 30, tier: 0 },
  two_pointers: { x: 90, y: 180, tier: 1 },
  binary_search: { x: 310, y: 180, tier: 1 },
  linked_list: { x: 530, y: 180, tier: 1 },
  dp_1d: { x: 750, y: 180, tier: 1 },
  sliding_window: { x: 90, y: 340, tier: 2 },
  trees: { x: 530, y: 340, tier: 2 },
  heap: { x: 420, y: 500, tier: 3 },
  graphs: { x: 640, y: 500, tier: 3 },
};

const CARD_WIDTH = 210;
const CARD_HEIGHT = 100;

// Topic to problems catalog filter parameter
const TOPIC_FILTER_MAP: Record<string, string> = {
  arrays_hashing: "Arrays",
  two_pointers: "Two Pointers",
  binary_search: "Binary Search",
  sliding_window: "Sliding Window",
  linked_list: "Linked List",
  trees: "Trees",
  dp_1d: "Dynamic Programming",
  heap: "Heap",
  graphs: "Graphs",
};

export function SkillTreeGraph({
  nodes,
  onSelectNode,
  className = "",
}: SkillTreeGraphProps) {
  const [selectedNode, setSelectedNode] = useState<EvaluatedSkillNode | null>(null);

  const nodeMap = new Map<string, EvaluatedSkillNode>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
  }

  const getIcon = (iconName: string) => {
    const props = { className: "w-5 h-5" };
    switch (iconName) {
      case "Layers":
        return <Layers {...props} />;
      case "Split":
        return <Split {...props} />;
      case "Search":
        return <Search {...props} />;
      case "Maximize":
        return <Maximize {...props} />;
      case "GitCommit":
        return <GitCommit {...props} />;
      case "GitFork":
        return <GitFork {...props} />;
      case "TrendingUp":
        return <TrendingUp {...props} />;
      case "Boxes":
        return <Boxes {...props} />;
      case "Network":
        return <Network {...props} />;
      default:
        return <Sparkles {...props} />;
    }
  };

  const handleNodeClick = (node: EvaluatedSkillNode) => {
    setSelectedNode(node);
    if (onSelectNode) {
      onSelectNode(node);
    }
  };

  return (
    <div className={`relative overflow-x-auto rounded-2xl border border-slate-800 bg-[#090d16] p-6 shadow-2xl ${className}`}>
      {/* Visual Header / Legend */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Algorithm Mastery DAG</span>
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">
              Interactive
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Progress through foundational structures to unlock advanced graph and dynamic programming techniques.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-300">Unlocked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Mastered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
            <span className="text-slate-500">Locked</span>
          </div>
        </div>
      </div>

      {/* DAG Canvas Container */}
      <div className="relative mx-auto min-w-[980px] h-[640px]">
        {/* SVG Connecting Edges */}
        <svg
          className="absolute inset-0 pointer-events-none w-full h-full"
          viewBox="0 0 1050 640"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="edgeGradientActive" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#3b82f6" floodOpacity="0.4" />
            </filter>
          </defs>

          {nodes.map((childNode) => {
            const childCoords = NODE_COORDINATES[childNode.id];
            if (!childCoords) return null;

            return childNode.prerequisites.map((prereqId) => {
              const parentCoords = NODE_COORDINATES[prereqId];
              if (!parentCoords) return null;

              const startX = parentCoords.x + CARD_WIDTH / 2;
              const startY = parentCoords.y + CARD_HEIGHT;
              const endX = childCoords.x + CARD_WIDTH / 2;
              const endY = childCoords.y;

              const dy = endY - startY;
              const pathData = `M ${startX} ${startY} C ${startX} ${startY + dy * 0.5}, ${endX} ${startY + dy * 0.5}, ${endX} ${endY}`;

              const isEdgeUnlocked = childNode.isUnlocked;

              return (
                <path
                  key={`${prereqId}->${childNode.id}`}
                  d={pathData}
                  fill="none"
                  stroke={isEdgeUnlocked ? "url(#edgeGradientActive)" : "#334155"}
                  strokeWidth={isEdgeUnlocked ? 2.5 : 1.5}
                  strokeDasharray={isEdgeUnlocked ? "none" : "5 5"}
                  filter={isEdgeUnlocked ? "url(#glow)" : "none"}
                  className="transition-all duration-300"
                />
              );
            });
          })}
        </svg>

        {/* HTML Interactive Node Cards */}
        {nodes.map((node) => {
          const coords = NODE_COORDINATES[node.id] || { x: 0, y: 0 };
          const isMastered = node.masteryScore >= 100;
          const isUnlocked = node.isUnlocked;

          return (
            <div
              key={node.id}
              onClick={() => handleNodeClick(node)}
              style={{
                left: `${coords.x}px`,
                top: `${coords.y}px`,
                width: `${CARD_WIDTH}px`,
                height: `${CARD_HEIGHT}px`,
              }}
              className={`absolute flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-200 select-none ${
                isUnlocked
                  ? isMastered
                    ? "border-emerald-500/50 bg-[#0d1c18] hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer active:scale-98"
                    : "border-blue-500/40 bg-[#0e1626] hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer active:scale-98"
                  : "border-slate-800/80 bg-[#0a0f1a]/80 opacity-60 grayscale-[30%] cursor-pointer hover:border-slate-700"
              }`}
            >
              {/* Top Row: Icon & Status Badge */}
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    isUnlocked
                      ? isMastered
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-blue-500/20 text-blue-400"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {getIcon(node.icon)}
                </div>

                <div className="flex items-center gap-1">
                  {isUnlocked ? (
                    isMastered ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Mastered</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
                        <Unlock className="w-3 h-3" />
                        <span>Unlocked</span>
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-700">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span>Locked</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Middle: Topic Name */}
              <div className="mt-1">
                <h3 className="text-xs font-bold text-white tracking-tight truncate">
                  {node.topicName}
                </h3>
              </div>

              {/* Bottom: Progress Bar & Solves */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="text-slate-400">
                    {node.solvedCount} / {node.requiredSolves} solved
                  </span>
                  <span className={isUnlocked ? "text-blue-400 font-bold" : "text-slate-500"}>
                    {node.masteryScore}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isMastered ? "bg-emerald-400" : "bg-blue-500"
                    }`}
                    style={{ width: `${node.masteryScore}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Node Details Modal */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-700/80 bg-[#0d1424] p-6 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  selectedNode.isUnlocked
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "bg-slate-800 text-slate-500 border border-slate-700"
                }`}
              >
                {getIcon(selectedNode.icon)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{selectedNode.topicName}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-xs font-bold ${
                      selectedNode.isUnlocked ? "text-blue-400" : "text-slate-400"
                    }`}
                  >
                    {selectedNode.isUnlocked ? "Unlocked & Ready" : "Locked (Prerequisites Pending)"}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs font-mono text-slate-400">
                    Mastery: {selectedNode.masteryScore}%
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 text-xs leading-relaxed text-slate-300">
              {selectedNode.description}
            </div>

            {/* Prerequisites breakdown */}
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Prerequisites
              </h4>
              {selectedNode.prerequisites.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Foundational topic (No prerequisites required)</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selectedNode.prerequisites.map((prereqId) => {
                    const prereq = nodeMap.get(prereqId);
                    const isMet = prereq && prereq.solvedCount >= prereq.requiredSolves;
                    return (
                      <div
                        key={prereqId}
                        className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2 border border-slate-800/60 text-xs"
                      >
                        <div className="flex items-center gap-2 text-slate-300">
                          {isMet ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Lock className="w-4 h-4 text-slate-500" />
                          )}
                          <span>{prereq?.topicName ?? prereqId}</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">
                          {prereq?.solvedCount ?? 0} / {prereq?.requiredSolves ?? 2} solves
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedNode(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              {selectedNode.isUnlocked ? (
                <Link
                  href={`/problems?topic=${encodeURIComponent(
                    TOPIC_FILTER_MAP[selectedNode.id] || selectedNode.topicName
                  )}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-600/20 active:scale-95"
                >
                  <span>Practice Challenges</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-500 cursor-not-allowed border border-slate-700/50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Topic Locked</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
