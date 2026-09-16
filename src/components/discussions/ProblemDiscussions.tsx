"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ThumbsUp,
  MessageSquare,
  PlusCircle,
  Tag,
  Clock,
  User,
  Copy,
  Check,
  ChevronRight,
  ArrowLeft,
  X,
  Sparkles,
  Search,
  Filter,
} from "lucide-react";
import type { DiscussionItem } from "@/lib/discussions/seed-discussions";

interface ProblemDiscussionsProps {
  problemSlug: string;
  problemId?: string;
}

const COMMON_TAG_SUGGESTIONS = [
  "O(N) Time",
  "O(1) Space",
  "O(N) Space",
  "O(N^2) Time",
  "Hash Table",
  "Two Pointers",
  "Stack",
  "Recursion",
  "Binary Search",
  "Optimal",
];

export const ProblemDiscussions: React.FC<ProblemDiscussionsProps> = ({
  problemSlug,
}) => {
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<DiscussionItem | null>(null);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [upvotedPostIds, setUpvotedPostIds] = useState<Set<string>>(new Set());
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // New Post Form State
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newAuthor, setNewAuthor] = useState("coder_dev");
  const [selectedTags, setSelectedTags] = useState<string[]>(["O(N) Time"]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchDiscussions = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = selectedTag
        ? `/api/problems/${problemSlug}/discussions?tag=${encodeURIComponent(
            selectedTag
          )}`
        : `/api/problems/${problemSlug}/discussions`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDiscussions(data.discussions || []);
      }
    } catch (err) {
      console.error("Failed to load discussions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [problemSlug, selectedTag]);

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  const handleUpvote = async (post: DiscussionItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Optimistic update
    const alreadyUpvoted = upvotedPostIds.has(post.id);
    const delta = alreadyUpvoted ? -1 : 1;

    setDiscussions((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, upvotes: p.upvotes + delta } : p
      )
    );

    if (selectedPost && selectedPost.id === post.id) {
      setSelectedPost({
        ...selectedPost,
        upvotes: selectedPost.upvotes + delta,
      });
    }

    setUpvotedPostIds((prev) => {
      const next = new Set(prev);
      if (alreadyUpvoted) {
        next.delete(post.id);
      } else {
        next.add(post.id);
      }
      return next;
    });

    try {
      await fetch(`/api/problems/${problemSlug}/discussions/${post.id}/upvote`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Upvote failed:", err);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError("Please enter a title for your solution.");
      return;
    }
    if (!newContent.trim()) {
      setFormError("Please enter content or code explanation.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/problems/${problemSlug}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          approachTags: selectedTags,
          authorName: newAuthor.trim() || "coder_dev",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to publish discussion post");
      }

      const data = await res.json();
      setIsNewPostModalOpen(false);
      setNewTitle("");
      setNewContent("");
      setSelectedTags(["O(N) Time"]);

      // Refresh discussions and select the newly created post
      await fetchDiscussions();
      if (data.post) {
        setSelectedPost(data.post);
      }
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
      setCustomTagInput("");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const formatTimeAgo = (isoDate: string) => {
    const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Helper to render markdown-like content safely with formatted code blocks
  const renderMarkdownContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const firstLineBreak = part.indexOf("\n");
        const language =
          firstLineBreak !== -1
            ? part.slice(3, firstLineBreak).trim() || "javascript"
            : "javascript";
        const codeText =
          firstLineBreak !== -1
            ? part.slice(firstLineBreak + 1, -3)
            : part.slice(3, -3);

        const codeId = `code-block-${index}`;

        return (
          <div
            key={index}
            className="my-3 rounded-lg border border-slate-800 bg-[#070b12] overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
              <span className="font-mono font-medium uppercase text-blue-400">
                {language}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(codeText, codeId)}
                className="flex items-center gap-1 hover:text-slate-200 transition-colors"
              >
                {copiedCodeId === codeId ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }

      // Non-code lines
      return (
        <div key={index} className="space-y-2 text-slate-300">
          {part.split("\n\n").map((paragraph, pIdx) => {
            if (!paragraph.trim()) return null;

            // Headings
            if (paragraph.startsWith("### ")) {
              return (
                <h4
                  key={pIdx}
                  className="text-sm font-bold text-slate-100 mt-3 mb-1 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {paragraph.replace("### ", "")}
                </h4>
              );
            }
            if (paragraph.startsWith("## ")) {
              return (
                <h3
                  key={pIdx}
                  className="text-base font-bold text-slate-100 mt-4 mb-2"
                >
                  {paragraph.replace("## ", "")}
                </h3>
              );
            }

            // Bullet points
            if (paragraph.startsWith("- ")) {
              const bullets = paragraph.split("\n- ");
              return (
                <ul key={pIdx} className="list-disc list-inside space-y-1 my-2">
                  {bullets.map((b, bIdx) => (
                    <li key={bIdx} className="text-xs text-slate-300">
                      {b.replace(/^- /, "")}
                    </li>
                  ))}
                </ul>
              );
            }

            return (
              <p
                key={pIdx}
                className="text-xs text-slate-300 leading-relaxed whitespace-pre-line"
              >
                {paragraph}
              </p>
            );
          })}
        </div>
      );
    });
  };

  // -------------------------------------------------------------------------
  // VIEW: SINGLE DISCUSSION DETAIL
  // -------------------------------------------------------------------------
  if (selectedPost) {
    const isUpvoted = upvotedPostIds.has(selectedPost.id);

    return (
      <div className="flex flex-col h-full overflow-hidden space-y-4">
        {/* Detail Top Navigation */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <button
            type="button"
            onClick={() => setSelectedPost(null)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded hover:bg-slate-800/50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Discussions</span>
          </button>

          <button
            type="button"
            onClick={(e) => handleUpvote(selectedPost, e)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              isUpvoted
                ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-sm shadow-indigo-500/10"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600"
            }`}
          >
            <ThumbsUp
              className={`w-3.5 h-3.5 ${isUpvoted ? "fill-indigo-400" : ""}`}
            />
            <span>{selectedPost.upvotes} Upvotes</span>
          </button>
        </div>

        {/* Post Full Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 leading-snug">
              {selectedPost.title}
            </h2>

            {/* Author & Timestamp */}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                {selectedPost.author.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedPost.author.avatarUrl}
                    alt={selectedPost.author.username}
                    className="w-5 h-5 rounded-full bg-slate-800"
                  />
                ) : (
                  <User className="w-4 h-4 text-slate-500" />
                )}
                <span className="font-medium text-slate-300">
                  {selectedPost.author.username}
                </span>
              </div>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-500">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(selectedPost.createdAt)}
              </span>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {selectedPost.approachTags.map((tag) => (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                    tag.includes("O(1)")
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : tag.includes("O(N)")
                      ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                  }`}
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Formatted Markdown Content */}
          <div className="pt-2 border-t border-slate-800/80">
            {renderMarkdownContent(selectedPost.content)}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // VIEW: LIST OF DISCUSSIONS
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-full overflow-hidden space-y-4">
      {/* Top Action Bar: Search / Tags & New Post Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Solutions & Discussions ({discussions.length})
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setIsNewPostModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm shadow-blue-500/20 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Post</span>
        </button>
      </div>

      {/* Filter Tag Chips */}
      <div className="flex flex-wrap items-center gap-1.5 py-1">
        <button
          type="button"
          onClick={() => setSelectedTag(null)}
          className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
            selectedTag === null
              ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
              : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300 hover:border-slate-700"
          }`}
        >
          All Approaches
        </button>
        {["O(N) Time", "O(1) Space", "Hash Table", "Two Pointers", "Stack"].map(
          (tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                selectedTag === tag
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300 hover:border-slate-700"
              }`}
            >
              {tag}
            </button>
          )
        )}
      </div>

      {/* Discussions Feed */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
            <span>Loading community write-ups...</span>
          </div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-300 mb-1">
              No solutions found for this filter
            </p>
            <p className="text-[11px] text-slate-500 mb-3">
              Be the first engineer to publish an approach write-up!
            </p>
            <button
              type="button"
              onClick={() => setIsNewPostModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Share Solution</span>
            </button>
          </div>
        ) : (
          discussions.map((post) => {
            const isUpvoted = upvotedPostIds.has(post.id);

            return (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="group flex items-start gap-3 p-3 rounded-lg border border-slate-800/80 bg-slate-900/40 hover:bg-slate-850 hover:border-slate-700 transition-all cursor-pointer"
              >
                {/* Left: Upvote Pill */}
                <button
                  type="button"
                  onClick={(e) => handleUpvote(post, e)}
                  className={`flex flex-col items-center justify-center min-w-9 py-1 px-1 rounded-md border transition-all ${
                    isUpvoted
                      ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                  }`}
                  title="Upvote solution"
                >
                  <ThumbsUp
                    className={`w-3.5 h-3.5 ${
                      isUpvoted ? "fill-indigo-400 text-indigo-400" : ""
                    }`}
                  />
                  <span className="text-[10px] font-bold mt-0.5">
                    {post.upvotes}
                  </span>
                </button>

                {/* Right: Post Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-1">
                      {post.title}
                    </h4>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                  </div>

                  {/* Approach Tags */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {post.approachTags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60"
                      >
                        {tag}
                      </span>
                    ))}
                    {post.approachTags.length > 3 && (
                      <span className="text-[10px] text-slate-500 self-center">
                        +{post.approachTags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Author & Timestamp */}
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                    <span className="text-slate-400 font-medium truncate">
                      {post.author.username}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTimeAgo(post.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: SHARE NEW POST                                                */}
      {/* ------------------------------------------------------------------- */}
      {isNewPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0c121e] shadow-2xl p-5 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Share Your Solution Write-Up
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPostModalOpen(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreatePost}
              className="flex-1 overflow-y-auto space-y-4 pt-4 pr-1"
            >
              {formError && (
                <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Optimal O(N) Hash Map Approach with Step-by-Step Breakdown"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Author Alias */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Author Alias
                </label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="Your username"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Approach Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Approach Badges & Complexity
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMON_TAG_SUGGESTIONS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-500"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                {/* Custom tag input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    placeholder="Add custom tag (e.g. Greedy, DP)"
                    className="flex-1 px-3 py-1.5 text-xs rounded border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomTag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addCustomTag}
                    className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Content Markdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Explanation & Code (Markdown Supported)
                </label>
                <textarea
                  rows={8}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder={`### Intuition\nExplain the idea...\n\n### Complexity\n- Time: O(N)\n- Space: O(1)\n\n\`\`\`javascript\nfunction solution() {\n  // Your code here\n}\n\`\`\``}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed"
                  required
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewPostModalOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-lg text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? "Publishing..." : "Publish Write-Up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
