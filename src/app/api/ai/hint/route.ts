import { NextResponse } from "next/server";
import { generateSocraticHint, type HintTier } from "@/lib/ai/socratic-tutor";

// In-memory rate limiting map: ip -> timestamps[]
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(identifier) || [];
  const validTimestamps = timestamps.filter(
    (time) => now - time < RATE_LIMIT_WINDOW_MS
  );

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(identifier, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  rateLimitMap.set(identifier, validTimestamps);
  return false;
}

export async function POST(request: Request) {
  try {
    // 1. Rate limiting check
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        {
          error:
            "Rate limit exceeded. Please wait a moment before requesting another hint.",
        },
        { status: 429 }
      );
    }

    // 2. Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const { problemSlug, problemTitle, userCode, tier, errorContext, question } = body;

    // 3. Validation: problemSlug is required
    if (!problemSlug || typeof problemSlug !== "string" || problemSlug.trim() === "") {
      return NextResponse.json(
        { error: "problemSlug is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    // 4. Validation: tier must be 1, 2, or 3
    if (tier === undefined || tier === null || ![1, 2, 3].includes(tier)) {
      return NextResponse.json(
        { error: "Invalid tier. Hint tier must be 1, 2, or 3." },
        { status: 400 }
      );
    }

    // 5. Generate Socratic hint
    const result = await generateSocraticHint({
      problemSlug: problemSlug.trim(),
      problemTitle: typeof problemTitle === "string" ? problemTitle : undefined,
      userCode: typeof userCode === "string" ? userCode : undefined,
      tier: tier as HintTier,
      errorContext: typeof errorContext === "string" ? errorContext : undefined,
      question: typeof question === "string" ? question.trim() : undefined,
    });

    return NextResponse.json({
      hint: result.hint,
      tier: result.tier,
      guidanceType: result.guidanceType,
      source: result.source || "curated",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("AI Hint API error:", error);
    return NextResponse.json(
      { error: "Internal server error generating Socratic hint." },
      { status: 500 }
    );
  }
}
