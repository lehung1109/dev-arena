"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Bot,
  X,
  Send,
  Loader2,
  Lightbulb,
  Compass,
  ListOrdered,
  HelpCircle,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

export interface AITutorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  problemSlug: string;
  problemTitle: string;
  userCode: string;
  errorContext?: string;
}

export interface TutorMessage {
  id: string;
  role: "tutor" | "user";
  text: string;
  tier?: 1 | 2 | 3;
  guidanceType?: string;
  timestamp: string;
}

export const AITutorPanel: React.FC<AITutorPanelProps> = ({
  isOpen,
  onClose,
  problemSlug,
  problemTitle,
  userCode,
  errorContext,
}) => {
  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: "welcome-msg",
      role: "tutor",
      text: `Welcome to Dev Arena's Socratic AI Tutor!

I'm designed to help you build problem-solving independence. Rather than spoiling the solution with copy-paste code, I provide progressive pedagogical guidance:
- **Level 1**: Conceptual nudges & edge-case diagnostic questions
- **Level 2**: Algorithmic patterns & optimal data structures
- **Level 3**: Step-by-step pseudocode flow in natural language

Select a hint level above or ask any question about your logic below!`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3>(1);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const requestHint = async (tier: 1 | 2 | 3, customQuestion?: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    const questionText = customQuestion?.trim();
    if (questionText) {
      const userMsg: TutorMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text: questionText,
        tier,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputQuestion("");
    }

    try {
      const res = await fetch("/api/ai/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug,
          problemTitle,
          userCode,
          tier,
          errorContext,
          question: questionText || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to fetch hint (HTTP ${res.status})`
        );
      }

      const data = await res.json();
      const tutorMsg: TutorMessage = {
        id: `tutor-${Date.now()}`,
        role: "tutor",
        text: data.hint,
        tier: data.tier,
        guidanceType: data.guidanceType,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, tutorMsg]);
    } catch (err: any) {
      setErrorMessage(
        err.message || "Unable to reach Socratic Tutor. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isLoading) return;
    requestHint(selectedTier, inputQuestion);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "tutor",
        text: `History cleared. How can I guide you on "${problemTitle}"? Choose a hint level or type your question.`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  const renderTierBadge = (tier?: number) => {
    switch (tier) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 text-[10px] font-semibold">
            <Lightbulb className="h-3 w-3" />
            Level 1: Nudge
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold">
            <Compass className="h-3 w-3" />
            Level 2: Pattern
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 text-[10px] font-semibold">
            <ListOrdered className="h-3 w-3" />
            Level 3: Flow
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full sm:w-[440px] md:w-[480px] flex-col border-l border-slate-800 bg-[#090d16] text-slate-200 shadow-2xl transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-slate-800 bg-[#0c121e] px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-slate-100">
                Socratic AI Tutor
              </h2>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400 uppercase tracking-wide">
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
              {problemTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleClearHistory}
            title="Reset tutor chat history"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close AI Tutor"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Anti-spoiler Policy Banner */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 bg-slate-900/60 px-4 py-2 text-[11px] text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
        <span>
          Pedagogical Mode: Explanations are conceptual. Direct code answers are
          disabled.
        </span>
      </div>

      {/* Tier Selection Quick Actions */}
      <div className="border-b border-slate-800 bg-[#0c121e]/70 p-3">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Request Guided Hint:
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedTier(1);
              requestHint(1);
            }}
            disabled={isLoading}
            className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all disabled:opacity-50 ${
              selectedTier === 1
                ? "bg-blue-600/15 border-blue-500/40 text-blue-300 shadow-sm"
                : "bg-slate-900/50 border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Lightbulb className="h-3.5 w-3.5 mb-1 text-blue-400" />
            <span className="text-[11px] font-bold leading-tight">Level 1</span>
            <span className="text-[9px] text-slate-400 leading-tight">
              Nudge
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedTier(2);
              requestHint(2);
            }}
            disabled={isLoading}
            className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all disabled:opacity-50 ${
              selectedTier === 2
                ? "bg-amber-600/15 border-amber-500/40 text-amber-300 shadow-sm"
                : "bg-slate-900/50 border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Compass className="h-3.5 w-3.5 mb-1 text-amber-400" />
            <span className="text-[11px] font-bold leading-tight">Level 2</span>
            <span className="text-[9px] text-slate-400 leading-tight">
              Pattern
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedTier(3);
              requestHint(3);
            }}
            disabled={isLoading}
            className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all disabled:opacity-50 ${
              selectedTier === 3
                ? "bg-purple-600/15 border-purple-500/40 text-purple-300 shadow-sm"
                : "bg-slate-900/50 border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <ListOrdered className="h-3.5 w-3.5 mb-1 text-purple-400" />
            <span className="text-[11px] font-bold leading-tight">Level 3</span>
            <span className="text-[9px] text-slate-400 leading-tight">
              Pseudocode
            </span>
          </button>
        </div>
      </div>

      {/* Error Context Diagnostic Banner if runner error is present */}
      {errorContext && (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block text-[11px] text-rose-300">
              Active Execution Issue Detected
            </span>
            <p className="text-[11px] text-rose-400/90 font-mono truncate max-w-[340px]">
              {errorContext}
            </p>
            <button
              type="button"
              onClick={() =>
                requestHint(
                  1,
                  `Can you help me diagnose this error conceptually: ${errorContext}`
                )
              }
              className="mt-1.5 text-[11px] font-medium text-rose-300 underline hover:text-rose-200"
            >
              Ask tutor to diagnose this error
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {msg.role === "tutor" ? (
                <>
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-600 text-white">
                    <Bot className="h-3 w-3" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">
                    Socratic Tutor
                  </span>
                  {renderTierBadge(msg.tier)}
                </>
              ) : (
                <>
                  <span className="text-xs font-semibold text-slate-400">
                    You
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {msg.timestamp}
                  </span>
                </>
              )}
            </div>

            <div
              className={`max-w-[92%] rounded-xl px-4 py-3 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                  : "border border-slate-800 bg-slate-900/80 text-slate-200 shadow-sm"
              }`}
            >
              <div className="whitespace-pre-wrap font-sans space-y-2">
                {msg.text}
              </div>
            </div>

            {msg.role === "tutor" && (
              <span className="text-[10px] text-slate-500 mt-1 pl-1">
                {msg.timestamp}
              </span>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-600 text-white animate-pulse">
              <Bot className="h-3 w-3" />
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-xs text-slate-300 shadow-sm flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
              <span>Formulating Socratic guidance...</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center justify-between">
            <span className="flex-1">{errorMessage}</span>
            <button
              type="button"
              onClick={() => requestHint(selectedTier)}
              className="text-[11px] font-semibold text-rose-400 underline hover:text-rose-300 ml-2"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-slate-800 bg-[#0c121e] p-3">
        <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Ask a question without receiving spoilers..."
              disabled={isLoading}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 pr-10 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || isLoading}
              className="absolute right-1.5 rounded-md bg-blue-600 p-1.5 text-white transition-all hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
            <span>Guiding Tier: Level {selectedTier}</span>
            <span>Press Enter to send</span>
          </div>
        </form>
      </div>
    </div>
  );
};
