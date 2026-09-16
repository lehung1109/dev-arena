"use client";

import React, { useState } from "react";
import {
  Zap,
  Flame,
  Target,
  Crown,
  Trophy,
  Shield,
  Star,
  Lock,
  CheckCircle2,
  Award,
  Info,
} from "lucide-react";
import type { Badge } from "@/lib/contests/rating-engine";

interface BadgeListProps {
  badges: Badge[];
  showFilter?: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Flame,
  Target,
  Crown,
  Trophy,
  Shield,
  Star,
  Award,
};

export function BadgeList({ badges, showFilter = true }: BadgeListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "All Badges" },
    { id: "achievement", label: "Achievements" },
    { id: "streak", label: "Streaks" },
    { id: "contest", label: "Contests" },
    { id: "rating", label: "Rating" },
  ];

  const filteredBadges =
    selectedCategory === "all"
      ? badges
      : badges.filter((b) => b.category === selectedCategory);

  const earnedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="w-full space-y-6">
      {/* Header and Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Achievement Badges</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Earn badges by solving challenges, participating in arenas, and building daily streaks.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
          <span className="text-slate-400">Unlocked:</span>
          <span className="font-semibold text-emerald-400">
            {earnedCount} / {badges.length}
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      {showFilter && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                selectedCategory === cat.id
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredBadges.map((badge) => {
          const IconComp = ICON_MAP[badge.icon] || Award;
          const isUnlocked = badge.unlocked;

          return (
            <div
              key={badge.id}
              className={`relative group rounded-xl p-4 transition-all duration-200 border ${
                isUnlocked
                  ? "bg-gradient-to-b from-slate-900/90 to-slate-900/40 border-slate-800 hover:border-slate-700 hover:shadow-lg hover:shadow-blue-500/5"
                  : "bg-slate-950/40 border-slate-800/50 opacity-65 hover:opacity-90"
              }`}
              onMouseEnter={() => setActiveTooltip(badge.id)}
              onMouseLeave={() => setActiveTooltip(null)}
            >
              <div className="flex items-start gap-3.5">
                {/* Badge Icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${
                    isUnlocked
                      ? badge.category === "contest"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-sm shadow-amber-500/20"
                        : badge.category === "streak"
                        ? "bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-sm shadow-orange-500/20"
                        : badge.category === "rating"
                        ? "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-sm shadow-purple-500/20"
                        : "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-sm shadow-blue-500/20"
                      : "bg-slate-900 border-slate-800 text-slate-500"
                  }`}
                >
                  {isUnlocked ? (
                    <IconComp className="w-6 h-6" />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-500" />
                  )}
                </div>

                {/* Badge Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4
                      className={`text-sm font-semibold truncate ${
                        isUnlocked ? "text-slate-100" : "text-slate-400"
                      }`}
                    >
                      {badge.title}
                    </h4>
                    {isUnlocked && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {badge.description}
                  </p>

                  {/* Progress or Status */}
                  <div className="mt-3">
                    {isUnlocked ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Unlocked
                      </span>
                    ) : badge.progress ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Progress</span>
                          <span className="font-mono">
                            {badge.progress.current} / {badge.progress.target}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-600 rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(
                                  (badge.progress.current /
                                    badge.progress.target) *
                                    100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/50">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Hover Tooltip / Criteria info */}
              {activeTooltip === badge.id && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 z-30 p-2.5 bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-xs text-slate-300 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-1.5 text-slate-200 font-medium mb-1">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    <span>Criteria</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {badge.description}
                  </p>
                  <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
                    <span className="capitalize">Category: {badge.category}</span>
                    <span className={isUnlocked ? "text-emerald-400 font-medium" : "text-amber-400"}>
                      {isUnlocked ? "Earned" : "In Progress"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
