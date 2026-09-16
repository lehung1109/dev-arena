/**
 * Error Stack Trace Sanitizer
 * Strips internal Web Worker, VM, and test runner noise from stack traces,
 * mapping errors to exact user-code lines and columns.
 * Dev Arena - 001-in-browser-code-arena
 */

export interface SanitizedError {
  message: string;
  line?: number;
  column?: number;
  cleanStack: string;
}

const INTERNAL_PATTERNS = [
  /runner\.worker\.(?:ts|js)/i,
  /WorkerRunnerManager\.(?:ts|js)/i,
  /execute\.(?:ts|js)/i,
  /deep-equal\.(?:ts|js)/i,
  /webpack-internal:/i,
  /_next\/static/i,
  /node_modules/i,
  /node:internal/i,
  /node:vm/i,
  /new Function/i,
  /runInContext/i,
  /vitest/i,
  /bun:test/i,
  /task_queues/i,
];

/**
 * Sanitizes an error or stack trace string, removing internal runner plumbing
 * and extracting user code line & column numbers.
 *
 * @param error Error object or raw error string
 * @param codeWrapperOffsetLines Number of wrapper boilerplate lines prepended to user code
 */
export function sanitizeStackTrace(
  error: Error | string,
  codeWrapperOffsetLines = 0
): SanitizedError {
  let message = "";
  let errorName = "Error";
  let rawStack = "";

  if (typeof error === "string") {
    const lines = error.split("\n");
    const firstLine = lines[0]?.trim() || "";

    const nameMatch = firstLine.match(/^([A-Za-z0-9_]+Error|[A-Za-z0-9_]+Exception|Error):\s*(.*)$/);
    if (nameMatch) {
      errorName = nameMatch[1];
      message = nameMatch[2].trim();
    } else {
      message = firstLine;
    }

    if (lines.length > 1 && lines.some((l) => l.includes("at "))) {
      rawStack = error;
    } else {
      rawStack = `${errorName}: ${message}`;
    }
  } else if (error instanceof Error || (typeof error === "object" && error !== null)) {
    message = error.message || String(error);
    errorName = error.name || "Error";
    rawStack = error.stack || `${errorName}: ${message}`;
  } else {
    message = String(error);
    rawStack = `Error: ${message}`;
  }

  // Check for line/col in message (common in SyntaxErrors: e.g. "(4:12)")
  let detectedLine: number | undefined;
  let detectedColumn: number | undefined;

  const msgLocationMatch = message.match(/\((\d+):(\d+)\)/) ||
    message.match(/line\s+(\d+),?\s+(?:col|column)\s+(\d+)/i) ||
    message.match(/at\s+line\s+(\d+)\s+column\s+(\d+)/i);

  if (msgLocationMatch) {
    const parsedLine = parseInt(msgLocationMatch[1], 10);
    const parsedCol = parseInt(msgLocationMatch[2], 10);
    if (!isNaN(parsedLine)) {
      detectedLine = codeWrapperOffsetLines > 0 && parsedLine > codeWrapperOffsetLines
        ? parsedLine - codeWrapperOffsetLines
        : parsedLine;
    }
    if (!isNaN(parsedCol)) {
      detectedColumn = parsedCol;
    }
  }

  // Parse stack lines
  const stackLines = rawStack.split("\n");
  const cleanLines: string[] = [];

  for (let i = 0; i < stackLines.length; i++) {
    const lineStr = stackLines[i];
    const trimmed = lineStr.trim();

    // Preserve the error title/message line (first line)
    if (i === 0) {
      cleanLines.push(lineStr);
      continue;
    }

    // Skip internal runtime frames
    const isInternal = INTERNAL_PATTERNS.some((pattern) => pattern.test(trimmed));
    if (isInternal) {
      continue;
    }

    // Check if this line references a user code location
    // Typical patterns:
    // "at twoSum (<anonymous>:5:14)"
    // "at <anonymous>:4:9"
    // "at eval (eval at ... <anonymous>:3:10)"
    // "at twoSum (evalmachine.<anonymous>:3:9)"
    const locationMatch = lineStr.match(
      /(?:<anonymous>|evalmachine\.<anonymous>|eval|blob:[^)]+):(\d+):(\d+)/
    );

    if (locationMatch) {
      const parsedLine = parseInt(locationMatch[1], 10);
      const parsedCol = parseInt(locationMatch[2], 10);

      if (detectedLine === undefined && !isNaN(parsedLine)) {
        detectedLine =
          codeWrapperOffsetLines > 0 && parsedLine > codeWrapperOffsetLines
            ? parsedLine - codeWrapperOffsetLines
            : parsedLine;
      }
      if (detectedColumn === undefined && !isNaN(parsedCol)) {
        detectedColumn = parsedCol;
      }

      // If we adjusted the line number, reflect it in the clean stack line
      if (
        codeWrapperOffsetLines > 0 &&
        parsedLine > codeWrapperOffsetLines &&
        detectedLine !== undefined
      ) {
        let adjustedLineStr = lineStr.replace(
          locationMatch[0],
          locationMatch[0].replace(`:${parsedLine}:`, `:${detectedLine}:`)
        );
        adjustedLineStr = adjustedLineStr.replace(/blob:[^)\s]+/g, "<sandbox>");
        cleanLines.push(adjustedLineStr);
        continue;
      }
    }

    const normalizedLine = lineStr.replace(/blob:[^)\s]+/g, "<sandbox>");
    cleanLines.push(normalizedLine);
  }

  // Sanitize any internal file system paths from message or cleanStack
  message = message.replace(
    /[A-Za-z]:\\[^:\s]+(?:execute|WorkerRunnerManager|runner\.worker|deep-equal)\.[a-z]+/gi,
    "<internal>"
  );

  let cleanStack = cleanLines.join("\n").trim();
  if (!cleanStack) {
    cleanStack = `${errorName}: ${message}`;
  }

  return {
    message,
    line: detectedLine,
    column: detectedColumn,
    cleanStack,
  };
}
