import { describe, it, expect, vi } from "vitest";
import {
  updateEditorMarkers,
  clearEditorMarkers,
} from "@/components/editor/monaco-markers";
import type { ExtendedASTAnalysisMetrics } from "@/lib/analysis/ast-analyzer";

describe("Monaco Markers Synchronizer Unit Tests", () => {
  const createMockMonaco = () => {
    const setModelMarkers = vi.fn();
    return {
      MarkerSeverity: {
        Error: 8,
        Warning: 4,
        Info: 2,
      },
      editor: {
        setModelMarkers,
      },
    } as any;
  };

  const createMockEditor = (lineCount = 20, maxCol = 80) => {
    const model = {
      getLineCount: vi.fn(() => lineCount),
      getLineMaxColumn: vi.fn(() => maxCol),
    };
    return {
      getModel: vi.fn(() => model),
    } as any;
  };

  it("translates syntax errors into Monaco Error markers", () => {
    const monaco = createMockMonaco();
    const editor = createMockEditor();

    const metrics: ExtendedASTAnalysisMetrics = {
      maxLoopDepth: 0,
      hasRecursion: false,
      syntaxValid: false,
      syntaxErrors: [
        {
          message: "Unexpected token ';'",
          line: 5,
          column: 12,
        },
      ],
      structuralWarnings: ["Syntax error at line 5, column 12"],
    };

    updateEditorMarkers(monaco, editor, metrics);

    expect(monaco.editor.setModelMarkers).toHaveBeenCalledTimes(1);
    const [model, owner, markers] = monaco.editor.setModelMarkers.mock.calls[0];
    expect(owner).toBe("dev-arena-ast");
    expect(markers).toHaveLength(1);
    expect(markers[0].severity).toBe(monaco.MarkerSeverity.Error);
    expect(markers[0].startLineNumber).toBe(5);
    expect(markers[0].message).toContain("Unexpected token");
  });

  it("translates nested loop warnings into Monaco Warning markers", () => {
    const monaco = createMockMonaco();
    const editor = createMockEditor();

    const metrics: ExtendedASTAnalysisMetrics = {
      maxLoopDepth: 2,
      hasRecursion: false,
      syntaxValid: true,
      syntaxErrors: [],
      structuralWarnings: [
        "Nested loop depth 2 detected. Potential O(N^2) complexity.",
      ],
      warningLocations: [
        {
          message: "Nested loop depth 2 detected (for loop). Potential O(N^2) complexity.",
          line: 4,
          column: 8,
          severity: "warning",
        },
      ],
    };

    updateEditorMarkers(monaco, editor, metrics);

    expect(monaco.editor.setModelMarkers).toHaveBeenCalledTimes(1);
    const [, , markers] = monaco.editor.setModelMarkers.mock.calls[0];
    expect(markers).toHaveLength(1);
    expect(markers[0].severity).toBe(monaco.MarkerSeverity.Warning);
    expect(markers[0].startLineNumber).toBe(4);
    expect(markers[0].message).toContain("O(N^2)");
  });

  it("clears markers when clearEditorMarkers is called", () => {
    const monaco = createMockMonaco();
    const editor = createMockEditor();

    clearEditorMarkers(monaco, editor);

    expect(monaco.editor.setModelMarkers).toHaveBeenCalledWith(
      expect.anything(),
      "dev-arena-ast",
      []
    );
  });

  it("safely handles null model or null editor", () => {
    const monaco = createMockMonaco();
    const editorNullModel = { getModel: () => null } as any;

    expect(() =>
      updateEditorMarkers(monaco, editorNullModel, {
        maxLoopDepth: 0,
        hasRecursion: false,
        syntaxValid: true,
        syntaxErrors: [],
        structuralWarnings: [],
      })
    ).not.toThrow();

    expect(monaco.editor.setModelMarkers).not.toHaveBeenCalled();
  });
});
