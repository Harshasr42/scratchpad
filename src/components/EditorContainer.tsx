'use client';

import React from 'react';
import Editor from '@monaco-editor/react';

interface EditorContainerProps {
  content: string;
  onChange: (value: string) => void;
  language: string;
}

export default function EditorContainer({
  content,
  onChange,
  language,
}: EditorContainerProps) {
  const isBlank = !content.trim();

  // Translate language selection value to Monaco editor supported languages
  const getMonacoLanguage = (lang: string) => {
    switch (lang) {
      case 'plaintext':
        return 'plaintext';
      case 'javascript':
        return 'javascript';
      case 'typescript':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'python':
        return 'python';
      case 'markdown':
        return 'markdown';
      case 'sql':
        return 'sql';
      case 'cpp':
        return 'cpp';
      case 'rust':
        return 'rust';
      case 'go':
        return 'go';
      default:
        return 'plaintext';
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    onChange(value ?? '');
  };

  return (
    <div className="flex-1 w-full bg-[linear-gradient(180deg,#070b13_0%,#090e18_100%)] relative overflow-hidden flex flex-col border-t border-white/6 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      {isBlank && (
        <div className="pointer-events-none absolute left-5 top-4 z-10 rounded-2xl border border-indigo-400/15 bg-slate-950/60 px-4 py-3 text-left shadow-2xl shadow-black/20 backdrop-blur-md">
          <p className="text-[11px] uppercase tracking-[0.24em] text-indigo-300/90">Writing area</p>
          <p className="mt-1 text-sm text-slate-200">Start typing here — your changes save automatically.</p>
        </div>
      )}
      <Editor
        height="100%"
        width="100%"
        theme="vs-dark"
        language={getMonacoLanguage(language)}
        value={content}
        onChange={handleEditorChange}
        onMount={(editor) => {
          editor.focus();
        }}
        loading={
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[linear-gradient(180deg,#070b13_0%,#090e18_100%)] text-slate-400 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <span className="text-xs font-mono font-medium tracking-widest text-slate-500 uppercase">
              Initializing Workspace...
            </span>
          </div>
        }
        options={{
          fontSize: 13.5,
          fontFamily: 'var(--font-geist-mono), Menlo, Monaco, "Courier New", monospace',
          minimap: { enabled: false },
          wordWrap: 'on',
          lineNumbers: 'on',
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            verticalScrollbarSize: 9,
            horizontalScrollbarSize: 9,
            useShadows: false,
          },
          padding: { top: 18, bottom: 18 },
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          tabSize: 2,
          insertSpaces: true,
          automaticLayout: true,
          fontLigatures: true,
          renderLineHighlight: 'all',
          lineDecorationsWidth: 10,
          glyphMargin: false,
          folding: false,
          renderFinalNewline: 'on',
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
        }}
      />
    </div>
  );
}
