"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import Monaco Editor to prevent SSR window reference errors
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#090d16] text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      <span className="ml-2 text-sm font-medium">Initializing Monaco Editor...</span>
    </div>
  ),
});

interface MonacoCodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string | number;
}

export const MonacoCodeEditor: React.FC<MonacoCodeEditorProps> = ({
  value,
  onChange,
  language = "javascript",
  readOnly = false,
  height = "100%",
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#090d16] text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        <span className="ml-2 text-xs">Loading Editor...</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden bg-[#090d16]">
      <Editor
        height={height}
        language={language}
        value={value}
        theme="vs-dark"
        onChange={(val) => onChange(val || "")}
        options={{
          fontSize: 14,
          fontFamily: "'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace",
          fontLigatures: true,
          tabSize: 2,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          readOnly,
          lineNumbers: "on",
          folding: true,
          foldingHighlight: true,
          glyphMargin: false,
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          renderLineHighlight: "all",
          cursorBlinking: "smooth",
          smoothScrolling: true,
          contextmenu: true,
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
};
