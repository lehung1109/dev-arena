/**
 * Monaco Editor Marker Synchronizer
 * Dev Arena - 001-in-browser-code-arena
 *
 * Translates static AST metrics, syntax errors, and complexity/structural warnings
 * into native Monaco editor squiggle underlines and hover tooltips.
 */

import type { ASTAnalysisMetrics } from "@/types/runner";
import type { ExtendedASTAnalysisMetrics } from "@/lib/analysis/ast-analyzer";

export type MonacoInstance = typeof import("monaco-editor");
export type MonacoEditorInstance = import("monaco-editor").editor.IStandaloneCodeEditor;

const MARKER_OWNER = "dev-arena-ast";

/**
 * Updates Monaco editor line markers from AST analysis metrics.
 * Maps syntax errors to MarkerSeverity.Error and loop/anti-pattern warnings to MarkerSeverity.Warning.
 */
export function updateEditorMarkers(
  monaco: MonacoInstance,
  editor: MonacoEditorInstance,
  astMetrics: ASTAnalysisMetrics
): void {
  if (!monaco || !editor) return;

  const model = editor.getModel();
  if (!model) return;

  const markers: import("monaco-editor").editor.IMarkerData[] = [];
  const lineCount = model.getLineCount();

  // 1. Process Syntax Errors
  if (astMetrics.syntaxErrors && astMetrics.syntaxErrors.length > 0) {
    for (const err of astMetrics.syntaxErrors) {
      const line = Math.max(1, Math.min(err.line || 1, lineCount));
      const lineMaxCol = model.getLineMaxColumn(line);
      const startCol = Math.max(1, Math.min((err.column || 0) + 1, lineMaxCol));
      const endCol = Math.max(startCol, lineMaxCol);

      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: err.message,
        startLineNumber: line,
        startColumn: startCol,
        endLineNumber: line,
        endColumn: endCol,
      });
    }
  }

  // 2. Process Structural and Loop Warnings with Locations
  const ext = astMetrics as ExtendedASTAnalysisMetrics;
  if (ext.warningLocations && ext.warningLocations.length > 0) {
    for (const warn of ext.warningLocations) {
      const startLine = Math.max(1, Math.min(warn.line || 1, lineCount));
      const endLine = warn.endLine
        ? Math.max(startLine, Math.min(warn.endLine, lineCount))
        : startLine;

      const startLineMaxCol = model.getLineMaxColumn(startLine);
      const endLineMaxCol = model.getLineMaxColumn(endLine);

      const startCol = Math.max(1, Math.min((warn.column || 0) + 1, startLineMaxCol));
      const endCol = warn.endColumn
        ? Math.max(startCol, Math.min(warn.endColumn + 1, endLineMaxCol))
        : endLineMaxCol;

      const severity =
        warn.severity === "error"
          ? monaco.MarkerSeverity.Error
          : warn.severity === "info"
          ? monaco.MarkerSeverity.Info
          : monaco.MarkerSeverity.Warning;

      markers.push({
        severity,
        message: warn.message,
        startLineNumber: startLine,
        startColumn: startCol,
        endLineNumber: endLine,
        endColumn: endCol,
      });
    }
  } else if (astMetrics.structuralWarnings && astMetrics.structuralWarnings.length > 0) {
    // If no specific line locations, attach general structural warnings to line 1
    for (const warnMsg of astMetrics.structuralWarnings) {
      if (astMetrics.syntaxValid) {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message: warnMsg,
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: model.getLineMaxColumn(1),
        });
      }
    }
  }

  monaco.editor.setModelMarkers(model, MARKER_OWNER, markers);
}

/**
 * Clears all AST analysis markers from the editor.
 */
export function clearEditorMarkers(
  monaco: MonacoInstance,
  editor: MonacoEditorInstance
): void {
  if (!monaco || !editor) return;
  const model = editor.getModel();
  if (model) {
    monaco.editor.setModelMarkers(model, MARKER_OWNER, []);
  }
}
