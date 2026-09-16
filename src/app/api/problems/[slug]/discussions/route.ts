import { NextResponse } from "next/server";
import {
  getDiscussionsByProblem,
  addDiscussion,
} from "@/lib/discussions/seed-discussions";
import {
  sanitizeDiscussionContent,
  sanitizeDiscussionTitle,
} from "@/lib/discussions/sanitizer";
import { db } from "@/lib/db/client";
import { discussionPosts, problems } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ slug: string }> | { slug: string };
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const params = await context.params;
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { error: "Problem slug is required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tagFilter = searchParams.get("tag") || undefined;

    // First retrieve from in-memory / seeded store
    let discussions = getDiscussionsByProblem(slug, tagFilter);

    // Optional DB integration if healthy
    try {
      if (
        process.env.DATABASE_URL &&
        !process.env.DATABASE_URL.includes("mock_pass")
      ) {
        const prob = await db.query.problems.findFirst({
          where: eq(problems.slug, slug),
        });

        if (prob) {
          const dbPosts = await db
            .select()
            .from(discussionPosts)
            .where(eq(discussionPosts.problemId, prob.id))
            .orderBy(desc(discussionPosts.upvotes));

          if (dbPosts && dbPosts.length > 0) {
            // Map DB posts to format
            const mappedDbPosts = dbPosts.map((dp) => ({
              id: dp.id,
              problemSlug: slug,
              title: dp.title,
              content: dp.content,
              approachTags: (dp.approachTags as string[]) || [],
              upvotes: dp.upvotes,
              createdAt: dp.createdAt ? new Date(dp.createdAt).toISOString() : new Date().toISOString(),
              author: {
                id: dp.authorId,
                username: "community_user",
                avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${dp.authorId}`,
              },
            }));

            // Merge with seeded discussions without duplicate IDs
            const seenIds = new Set(mappedDbPosts.map((p) => p.id));
            const filteredSeeded = discussions.filter((p) => !seenIds.has(p.id));
            discussions = [...mappedDbPosts, ...filteredSeeded];

            if (tagFilter) {
              const lowerTag = tagFilter.trim().toLowerCase();
              discussions = discussions.filter((p) =>
                p.approachTags.some((t) => t.toLowerCase() === lowerTag)
              );
            }
          }
        }
      }
    } catch {
      // Fall back seamlessly to in-memory store
    }

    return NextResponse.json({
      problemSlug: slug,
      discussions,
      totalCount: discussions.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch discussions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const params = await context.params;
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { error: "Problem slug is required" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawTitle = body?.title;
    const rawContent = body?.content;
    const rawTags = body?.approachTags || [];
    const authorName = body?.authorName || "dev_enthusiast";

    if (!rawTitle || typeof rawTitle !== "string" || !rawTitle.trim()) {
      return NextResponse.json(
        { error: "Discussion title is required and cannot be empty" },
        { status: 400 }
      );
    }

    if (!rawContent || typeof rawContent !== "string" || !rawContent.trim()) {
      return NextResponse.json(
        { error: "Discussion content is required and cannot be empty" },
        { status: 400 }
      );
    }

    // XSS Sanitization
    const sanitizedTitle = sanitizeDiscussionTitle(rawTitle);
    const sanitizedContent = sanitizeDiscussionContent(rawContent);

    const approachTags = Array.isArray(rawTags)
      ? rawTags.map((t) => String(t).trim()).filter(Boolean)
      : [];

    const newPost = addDiscussion(slug, {
      title: sanitizedTitle,
      content: sanitizedContent,
      approachTags,
      authorName,
    });

    return NextResponse.json({ post: newPost }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create discussion" },
      { status: 500 }
    );
  }
}
