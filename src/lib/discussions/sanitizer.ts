/**
 * Discussions Content and Title Sanitizer
 * Protects against XSS attacks, malicious script injection, and unsafe attributes
 * while preserving valid Markdown structures.
 */

export function sanitizeDiscussionTitle(title: string): string {
  if (!title) return "";
  // Strip all HTML tags from titles
  return title
    .replace(/<[^>]*>?/gm, "")
    .trim();
}

export function sanitizeDiscussionContent(content: string): string {
  if (!content) return "";

  let sanitized = content;

  // 1. Remove dangerous script, iframe, object, embed, applet, meta, and link tags along with contents
  sanitized = sanitized.replace(
    /<(script|iframe|object|embed|applet|meta|link)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi,
    ""
  );

  // 2. Remove self-closing or dangling dangerous tags
  sanitized = sanitized.replace(
    /<\/?(script|iframe|object|embed|applet|meta|link)[^>]*>/gi,
    ""
  );

  // 3. Remove inline event handlers (onerror, onload, onclick, onmouseover, etc.)
  sanitized = sanitized.replace(
    /\s+on[a-zA-Z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,
    ""
  );

  // 4. Remove javascript: pseudo-protocol URIs
  sanitized = sanitized.replace(/javascript:[^"'\s>)]*/gi, "");

  // 5. Remove data: URIs that could execute scripts (data:text/html, etc.)
  sanitized = sanitized.replace(/data:(?!image\/)[^"'\s>)]*/gi, "");

  return sanitized.trim();
}
