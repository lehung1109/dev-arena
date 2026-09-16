import { NextResponse } from "next/server";
import { upvoteDiscussion } from "@/lib/discussions/seed-discussions";

interface RouteContext {
  params: Promise<{ slug: string; id: string }> | { slug: string; id: string };
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Discussion ID is required" },
        { status: 400 }
      );
    }

    const updated = upvoteDiscussion(id);
    if (!updated) {
      return NextResponse.json(
        { error: "Discussion post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: updated.id,
      upvotes: updated.upvotes,
      message: "Upvote recorded successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to upvote discussion" },
      { status: 500 }
    );
  }
}
