import { describe, it, expect } from "vitest";
import {
  GET as GET_DISCUSSIONS,
  POST as POST_DISCUSSION,
} from "@/app/api/problems/[slug]/discussions/route";
import { POST as POST_UPVOTE } from "@/app/api/problems/[slug]/discussions/[id]/upvote/route";

describe("Discussions API Contract: GET /api/problems/[slug]/discussions", () => {
  it("returns 200 with list of discussion posts for two-sum sorted by upvotes DESC", async () => {
    const request = new Request("http://localhost:3000/api/problems/two-sum/discussions");
    const response = await GET_DISCUSSIONS(request, {
      params: Promise.resolve({ slug: "two-sum" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty("discussions");
    expect(Array.isArray(data.discussions)).toBe(true);
    expect(data.discussions.length).toBeGreaterThanOrEqual(1);

    // Verify properties of discussion posts
    const first = data.discussions[0];
    expect(typeof first.id).toBe("string");
    expect(first.problemSlug).toBe("two-sum");
    expect(typeof first.title).toBe("string");
    expect(typeof first.content).toBe("string");
    expect(Array.isArray(first.approachTags)).toBe(true);
    expect(typeof first.upvotes).toBe("number");
    expect(first.author).toBeDefined();
    expect(typeof first.author.username).toBe("string");
    expect(typeof first.createdAt).toBe("string");

    // Verify descending sort by upvotes
    for (let i = 1; i < data.discussions.length; i++) {
      expect(data.discussions[i - 1].upvotes).toBeGreaterThanOrEqual(
        data.discussions[i].upvotes
      );
    }
  });

  it("filters discussions by tag query parameter", async () => {
    const request = new Request(
      "http://localhost:3000/api/problems/two-sum/discussions?tag=Hash%20Table"
    );
    const response = await GET_DISCUSSIONS(request, {
      params: Promise.resolve({ slug: "two-sum" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.discussions)).toBe(true);

    for (const post of data.discussions) {
      const match = post.approachTags.some(
        (t: string) => t.toLowerCase() === "hash table"
      );
      expect(match).toBe(true);
    }
  });

  it("returns 400 when problem slug is missing", async () => {
    const request = new Request("http://localhost:3000/api/problems//discussions");
    const response = await GET_DISCUSSIONS(request, {
      params: Promise.resolve({ slug: "" }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });
});

describe("Discussions API Contract: POST /api/problems/[slug]/discussions", () => {
  it("creates a new discussion post with valid payload and returns 201", async () => {
    const newPost = {
      title: "Clean JavaScript Solution with Map",
      content: "Here is a clean $O(N)$ solution using JavaScript Map.\n\n```js\nconst map = new Map();\n```",
      approachTags: ["O(N) Time", "O(N) Space", "Map"],
      authorName: "AlgoMaster",
    };

    const request = new Request("http://localhost:3000/api/problems/two-sum/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPost),
    });

    const response = await POST_DISCUSSION(request, {
      params: Promise.resolve({ slug: "two-sum" }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();

    expect(data).toHaveProperty("post");
    expect(data.post.title).toBe(newPost.title);
    expect(data.post.content).toContain("clean $O(N)$ solution");
    expect(data.post.approachTags).toEqual(expect.arrayContaining(["Map"]));
    expect(data.post.upvotes).toBe(0);
    expect(data.post.problemSlug).toBe("two-sum");
  });

  it("validates required title and content fields", async () => {
    // Missing title
    const reqNoTitle = new Request("http://localhost:3000/api/problems/two-sum/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "Some content here" }),
    });
    const resNoTitle = await POST_DISCUSSION(reqNoTitle, {
      params: Promise.resolve({ slug: "two-sum" }),
    });
    expect(resNoTitle.status).toBe(400);
    const errTitle = await resNoTitle.json();
    expect(errTitle.error).toMatch(/title/i);

    // Missing content
    const reqNoContent = new Request("http://localhost:3000/api/problems/two-sum/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Valid Title" }),
    });
    const resNoContent = await POST_DISCUSSION(reqNoContent, {
      params: Promise.resolve({ slug: "two-sum" }),
    });
    expect(resNoContent.status).toBe(400);
    const errContent = await resNoContent.json();
    expect(errContent.error).toMatch(/content/i);
  });

  it("sanitizes dangerous XSS payloads in discussion post content and title", async () => {
    const maliciousPayload = {
      title: "Solution <script>alert('xss-title')</script>",
      content: "Check this out: <img src=x onerror=alert('xss-img')> and <script>document.cookie='steal'</script>",
      approachTags: ["O(1)"],
    };

    const request = new Request("http://localhost:3000/api/problems/two-sum/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(maliciousPayload),
    });

    const response = await POST_DISCUSSION(request, {
      params: Promise.resolve({ slug: "two-sum" }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();

    expect(data.post.title).not.toContain("<script>");
    expect(data.post.title).not.toContain("</script>");
    expect(data.post.content).not.toContain("<script>");
    expect(data.post.content).not.toContain("onerror=");
  });
});

describe("Discussions API Contract: POST /api/problems/[slug]/discussions/[id]/upvote", () => {
  it("increments upvote count for an existing discussion post", async () => {
    // First get a discussion ID from two-sum
    const getReq = new Request("http://localhost:3000/api/problems/two-sum/discussions");
    const getRes = await GET_DISCUSSIONS(getReq, {
      params: Promise.resolve({ slug: "two-sum" }),
    });
    const { discussions } = await getRes.json();
    const targetPost = discussions[0];
    const initialUpvotes = targetPost.upvotes;

    // Upvote it
    const upvoteReq = new Request(
      `http://localhost:3000/api/problems/two-sum/discussions/${targetPost.id}/upvote`,
      { method: "POST" }
    );
    const upvoteRes = await POST_UPVOTE(upvoteReq, {
      params: Promise.resolve({ slug: "two-sum", id: targetPost.id }),
    });

    expect(upvoteRes.status).toBe(200);
    const upvoteData = await upvoteRes.json();
    expect(upvoteData.upvotes).toBe(initialUpvotes + 1);
  });

  it("returns 404 when upvoting non-existent post id", async () => {
    const upvoteReq = new Request(
      "http://localhost:3000/api/problems/two-sum/discussions/non-existent-id/upvote",
      { method: "POST" }
    );
    const upvoteRes = await POST_UPVOTE(upvoteReq, {
      params: Promise.resolve({ slug: "two-sum", id: "non-existent-id" }),
    });

    expect(upvoteRes.status).toBe(404);
  });
});
