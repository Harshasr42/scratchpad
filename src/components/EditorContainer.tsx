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
    <div className="flex-1 w-full bg-[#030712] relative overflow-hidden flex flex-col">
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
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#030712] text-slate-400 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <span className="text-xs font-mono font-medium tracking-widest text-slate-500 uppercase">
              Initializing Workspace...
            </span>
          </div>
        }
        options={{
          fontSize: 14,
          fontFamily: 'var(--font-geist-mono), Menlo, Monaco, "Courier New", monospace',
          minimap: { enabled: false },
          wordWrap: 'on',
          lineNumbers: 'on',
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
            useShadows: false,
          },
          padding: { top: 16, bottom: 16 },
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          tabSize: 2,
          insertSpaces: true,
          automaticLayout: true,
          fontLigatures: true,
          renderLineHighlight: 'all',
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
        }}
      />
    </div>
  );
}
