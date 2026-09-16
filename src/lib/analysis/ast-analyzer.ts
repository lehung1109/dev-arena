/**
 * Static AST Analysis Engine
 * Dev Arena - 001-in-browser-code-arena
 *
 * Uses @babel/parser and @babel/traverse to statically analyze user code
 * for loop depth, recursion patterns, syntax errors, and algorithmic complexity hints.
 */

import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import type { ASTAnalysisMetrics } from "@/types/runner";

const traverse =
  typeof (_traverse as any).default === "function"
    ? (_traverse as any).default
    : _traverse;

const ITERATION_METHODS = new Set([
  "forEach",
  "map",
  "filter",
  "reduce",
  "reduceRight",
  "flatMap",
  "some",
  "every",
  "find",
  "findIndex",
]);

export interface ASTWarningLocation {
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  severity?: "error" | "warning" | "info";
}

export interface ExtendedASTAnalysisMetrics extends ASTAnalysisMetrics {
  warningLocations?: ASTWarningLocation[];
}

/**
 * Statically inspects user code using Babel AST parser and visitor.
 * Extracts maximum loop depth, detects direct recursion, and reports syntax errors.
 */
export function analyzeAST(code: string): ExtendedASTAnalysisMetrics {
  // Empty or whitespace-only code guard
  if (!code || !code.trim()) {
    return {
      maxLoopDepth: 0,
      hasRecursion: false,
      syntaxValid: true,
      syntaxErrors: [],
      structuralWarnings: [],
      warningLocations: [],
    };
  }

  let ast: any;
  try {
    ast = parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
      errorRecovery: false,
    });
  } catch (err: any) {
    const line = err.loc?.line ?? 1;
    const column = err.loc?.column ?? 0;
    const message = (err.message || "Syntax Error").replace(/\s*\(\d+:\d+\)$/, "");

    return {
      maxLoopDepth: 0,
      hasRecursion: false,
      syntaxValid: false,
      syntaxErrors: [
        {
          message,
          line,
          column,
        },
      ],
      structuralWarnings: [
        `Syntax error at line ${line}, column ${column}: ${message}`,
      ],
      warningLocations: [
        {
          message,
          line,
          column,
          severity: "error",
        },
      ],
    };
  }

  let currentLoopDepth = 0;
  let maxLoopDepth = 0;
  let hasRecursion = false;
  const structuralWarnings: string[] = [];
  const warningLocations: ASTWarningLocation[] = [];

  // Track enclosing named functions and variable declarators for recursion
  const functionScopeStack: string[] = [];

  // Helper to check if a node is an iteration method callback
  const isIterationCallback = (path: any): boolean => {
    const parentPath = path.parentPath;
    if (
      !parentPath ||
      (!parentPath.isCallExpression() &&
        !parentPath.isOptionalCallExpression() &&
        parentPath.node?.type !== "CallExpression" &&
        parentPath.node?.type !== "OptionalCallExpression")
    ) {
      return false;
    }
    const callNode = parentPath.node;
    if (
      callNode.callee &&
      (callNode.callee.type === "MemberExpression" ||
        callNode.callee.type === "OptionalMemberExpression") &&
      callNode.callee.property &&
      callNode.callee.property.type === "Identifier" &&
      ITERATION_METHODS.has(callNode.callee.property.name) &&
      callNode.arguments &&
      callNode.arguments[0] === path.node
    ) {
      return true;
    }
    return false;
  };

  const onEnterLoop = (path: any, loopType: string) => {
    currentLoopDepth++;
    if (currentLoopDepth > maxLoopDepth) {
      maxLoopDepth = currentLoopDepth;
    }

    const line = path.node.loc?.start.line ?? 1;
    const column = path.node.loc?.start.column ?? 0;
    const endLine = path.node.loc?.end.line ?? line;
    const endColumn = path.node.loc?.end.column ?? (column + 10);

    if (currentLoopDepth === 2) {
      warningLocations.push({
        message: `Nested loop depth 2 detected (${loopType}). Potential O(N^2) complexity.`,
        line,
        column,
        endLine,
        endColumn,
        severity: "warning",
      });
    } else if (currentLoopDepth === 3) {
      warningLocations.push({
        message: `Nested loop depth 3 detected (${loopType}). Potential O(N^3) complexity.`,
        line,
        column,
        endLine,
        endColumn,
        severity: "warning",
      });
    } else if (currentLoopDepth > 3) {
      warningLocations.push({
        message: `Deep nested loop depth ${currentLoopDepth} detected (${loopType}). High time complexity.`,
        line,
        column,
        endLine,
        endColumn,
        severity: "warning",
      });
    }
  };

  const onExitLoop = () => {
    if (currentLoopDepth > 0) {
      currentLoopDepth--;
    }
  };

  try {
    traverse(ast, {
      // 1. Traditional Loops
      ForStatement: {
        enter(path: any) {
          onEnterLoop(path, "for loop");
        },
        exit() {
          onExitLoop();
        },
      },
      WhileStatement: {
        enter(path: any) {
          onEnterLoop(path, "while loop");
        },
        exit() {
          onExitLoop();
        },
      },
      DoWhileStatement: {
        enter(path: any) {
          onEnterLoop(path, "do-while loop");
        },
        exit() {
          onExitLoop();
        },
      },
      ForOfStatement: {
        enter(path: any) {
          onEnterLoop(path, "for-of loop");
        },
        exit() {
          onExitLoop();
        },
      },
      ForInStatement: {
        enter(path: any) {
          onEnterLoop(path, "for-in loop");
        },
        exit() {
          onExitLoop();
        },
      },

      // 2. Higher-Order Array Iterations (forEach, map, filter, etc.)
      ArrowFunctionExpression: {
        enter(path: any) {
          if (isIterationCallback(path)) {
            onEnterLoop(path, "array iteration callback");
            path.setData("__isIterationLoop", true);
          }
        },
        exit(path: any) {
          if (path.getData("__isIterationLoop")) {
            onExitLoop();
          }
        },
      },
      FunctionExpression: {
        enter(path: any) {
          if (path.node.id?.name) {
            functionScopeStack.push(path.node.id.name);
          }
          if (isIterationCallback(path)) {
            onEnterLoop(path, "array iteration callback");
            path.setData("__isIterationLoop", true);
          }
        },
        exit(path: any) {
          if (path.node.id?.name) {
            functionScopeStack.pop();
          }
          if (path.getData("__isIterationLoop")) {
            onExitLoop();
          }
        },
      },

      // 3. Function and Variable Declarations for Recursion Scope
      FunctionDeclaration: {
        enter(path: any) {
          if (path.node.id?.name) {
            functionScopeStack.push(path.node.id.name);
          }
        },
        exit(path: any) {
          if (path.node.id?.name) {
            functionScopeStack.pop();
          }
        },
      },
      VariableDeclarator: {
        enter(path: any) {
          if (
            path.node.id &&
            path.node.id.type === "Identifier" &&
            path.node.init &&
            (path.node.init.type === "ArrowFunctionExpression" ||
              path.node.init.type === "FunctionExpression")
          ) {
            functionScopeStack.push(path.node.id.name);
            path.setData("__pushedScope", true);
          }
        },
        exit(path: any) {
          if (path.getData("__pushedScope")) {
            functionScopeStack.pop();
          }
        },
      },

      // 4. Call Expressions for Recursion Detection
      CallExpression(path: any) {
        const callee = path.node.callee;
        let calledName: string | null = null;

        if (callee.type === "Identifier") {
          calledName = callee.name;
        } else if (
          callee.type === "MemberExpression" &&
          callee.object?.type === "ThisExpression" &&
          callee.property?.type === "Identifier"
        ) {
          calledName = callee.property.name;
        }

        if (calledName && functionScopeStack.includes(calledName)) {
          // Verify that this call resolves to the enclosing function binding
          const binding = path.scope.getBinding(calledName);
          if (
            !binding ||
            binding.scope === path.scope ||
            binding.path.isFunctionDeclaration() ||
            binding.path.isVariableDeclarator()
          ) {
            hasRecursion = true;
            const line = path.node.loc?.start.line ?? 1;
            const column = path.node.loc?.start.column ?? 0;
            const endLine = path.node.loc?.end.line ?? line;
            const endColumn = path.node.loc?.end.column ?? (column + 10);
            warningLocations.push({
              message: `Recursive call to "${calledName}" detected at line ${line}.`,
              line,
              column,
              endLine,
              endColumn,
              severity: "warning",
            });
          }
        }
      },
    });
  } catch (err: any) {
    console.warn("AST traversal encountered error:", err);
  }

  // Construct structural summary warnings
  if (maxLoopDepth === 2) {
    structuralWarnings.push(
      "Nested loop depth 2 detected. Potential O(N^2) complexity."
    );
  } else if (maxLoopDepth === 3) {
    structuralWarnings.push(
      "Nested loop depth 3 detected. Potential O(N^3) complexity."
    );
  } else if (maxLoopDepth > 3) {
    structuralWarnings.push(
      `Nested loop depth ${maxLoopDepth} detected. High time complexity.`
    );
  }

  if (hasRecursion) {
    structuralWarnings.push(
      "Recursive function call detected. Watch for stack depth and exponential O(2^N) complexity if overlapping subproblems exist without memoization."
    );
  }

  return {
    maxLoopDepth,
    hasRecursion,
    syntaxValid: true,
    syntaxErrors: [],
    structuralWarnings,
    warningLocations,
  };
}
