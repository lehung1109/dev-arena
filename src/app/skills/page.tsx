"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  GitFork,
  CheckCircle2,
  Lock,
  Unlock,
  Sparkles,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
} from "lucide-react";
import { SkillTreeGraph } from "@/components/curriculum/SkillTreeGraph";
import { SkillRadarChart } from "@/components/curriculum/SkillRadarChart";
import {
  CANONICAL_SKILL_NODES,
  evaluateSkillTree,
  calculateRadarMastery,
  type EvaluatedSkillNode,
  type SkillCategoryMastery,
} from "@/lib/curriculum/skill-graph";

export default function CurriculumRoadmapPage() {
  const [nodes, setNodes] = useState<EvaluatedSkillNode[]>(() =>
    evaluateSkillTree(CANONICAL_SKILL_NODES, new Map())
  );
  const [radarCategories, setRadarCategories] = useState<SkillCategoryMastery[]>(() =>
    calculateRadarMastery(new Set())
  );
  const [loading, setLoading] = useState(true);

  const fetchSkillsData = async () => {
    try {
      setLoading(true);
      const [treeRes, radarRes] = await Promise.all([
        fetch("/api/skills/tree"),
        fetch("/api/skills/radar"),
      ]);

      if (treeRes.ok) {
        const treeData = await treeRes.json();
        if (treeData.nodes && Array.isArray(treeData.nodes)) {
          setNodes(treeData.nodes);
        }
      }

      if (radarRes.ok) {
        const radarData = await radarRes.json();
        if (radarData.categories && Array.isArray(radarData.categories)) {
          setRadarCategories(radarData.categories);
        }
      }
    } catch (err) {
      console.error("Failed to load skills data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkillsData();
  }, []);

  // Compute summary stats
  const totalNodes = nodes.length;
  const unlockedNodes = nodes.filter((n) => n.isUnlocked).length;
  const masteredNodes = nodes.filter((n) => n.masteryScore >= 100).length;
  const totalSolved = nodes.reduce((sum, n) => sum + n.solvedCount, 0);

  const overallMasteryPct =
    radarCategories.length > 0
      ? Math.round(
          radarCategories.reduce((sum, c) => sum + c.score, 0) / radarCategories.length
        )
      : 0;

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Hero Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curriculum Progression</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <GitFork className="w-8 h-8 text-emerald-400" />
            <span>DSA Skill Tree &amp; Mastery</span>
          </h1>
          <p className="mt-2 text-slate-400 text-sm max-w-2xl leading-relaxed">
            Follow a structured Directed Acyclic Graph (DAG) curriculum. Master foundational memory
            and pointer patterns to unlock advanced recursive trees, graphs, and dynamic programming.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={fetchSkillsData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-50"
            title="Refresh Curriculum Progress"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Progress</span>
          </button>
          <Link
            href="/problems"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            <span>Solve Problems</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span>DSA Mastery</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">{overallMasteryPct}%</div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${overallMasteryPct}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Unlock className="w-4 h-4 text-emerald-400" />
            <span>Nodes Unlocked</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {unlockedNodes} <span className="text-xs font-normal text-slate-500">/ {totalNodes}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalNodes - unlockedNodes} locked
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Nodes Mastered</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {masteredNodes} <span className="text-xs font-normal text-slate-500">/ {totalNodes}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">100% completion</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span>Solved Problems</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">{totalSolved}</div>
          <div className="text-[11px] text-slate-500 mt-1">Challenges verified</div>
        </div>
      </div>

      {/* Main Content Layout: Radar Chart on Left / Tree Graph on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Radar Chart Column (4 cols on lg) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl">
            <div className="mb-4">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Skill Mastery Radar</span>
                <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                  Multi-Dimensional
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Visual balance across core algorithm families. Balanced progress yields superior interview preparedness.
              </p>
            </div>

            {/* SVG Radar Chart */}
            <SkillRadarChart categories={radarCategories} size={320} />

            {/* Category Mastery List */}
            <div className="mt-6 space-y-2 border-t border-slate-800/80 pt-4">
              {radarCategories.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between text-xs py-1"
                >
                  <span className="text-slate-300 font-medium">{cat.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-mono text-[11px]">
                      {cat.solvedCount}/{cat.totalCount} solved
                    </span>
                    <span className="font-mono font-bold text-blue-400 w-10 text-right">
                      {cat.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skill Tree Graph Column (8 cols on lg) */}
        <div className="lg:col-span-8">
          <SkillTreeGraph nodes={nodes} />
        </div>
      </div>
    </div>
  );
}
