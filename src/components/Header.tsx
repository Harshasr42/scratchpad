'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Copy, Save, Check, FileCode, RefreshCw, ChevronDown, CheckCircle2, Download } from 'lucide-react';
import { useToast } from './Toast';

interface HeaderProps {
  pathKey: string;
  content: string;
  language: string;
  onLanguageChange: (lang: string) => void;
  onSave: () => Promise<void>;
  saveStatus: 'saved' | 'unsaved' | 'saving';
  lastSaved: string | null;
}

const LANGUAGES = [
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'python', label: 'Python' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'sql', label: 'SQL' },
  { value: 'cpp', label: 'C++' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
];

export default function Header({
  pathKey,
  content,
  language,
  onLanguageChange,
  onSave,
  saveStatus,
}: HeaderProps) {
  const { showToast } = useToast();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);

  // Copy full URL path for sharing
  const copyShareUrl = async () => {
    try {
      const shareUrl = window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedUrl(true);
      showToast('Share link copied to clipboard!', 'success');
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      showToast('Failed to copy share link', 'error');
    }
  };

  // Copy all content from the editor
  const copyAllContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedContent(true);
      showToast('All contents copied to clipboard!', 'success');
      setTimeout(() => setCopiedContent(false), 2000);
    } catch {
      showToast('Failed to copy content', 'error');
    }
  };

  const getStatusLabel = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'unsaved':
        return 'Unsaved Changes';
    }
  };

  const getStatusColor = () => {
    switch (saveStatus) {
      case 'saving':
        return 'bg-amber-400 shadow-amber-400/50';
      case 'saved':
        return 'bg-emerald-400 shadow-emerald-400/50';
      case 'unsaved':
        return 'bg-rose-400 shadow-rose-400/50';
    }
  };

  const currentLanguageLabel = LANGUAGES.find((l) => l.value === language)?.label || 'Plain Text';
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const lineCount = content.split('\n').length;

  const exportAsText = () => {
    const blob = new Blob([content || ''], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${pathKey || 'scratchpad'}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('Pad exported as .txt', 'success');
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/6 px-4 md:px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-[0_6px_30px_rgba(0,0,0,0.18)]">
      {/* Brand logo & Active Key path */}
      <div className="flex items-center gap-3 overflow-hidden">
        <Link 
          href="/"
          className="flex items-center gap-2 group flex-shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-white text-slate-950 flex items-center justify-center text-[11px] font-black shadow-sm shadow-black/20 group-hover:scale-105 transition-transform duration-200">
            SP
          </div>
          <span className="font-semibold text-lg text-slate-100 select-none hidden md:block tracking-tight">
            ScratchPad
          </span>
        </Link>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-800 hidden md:block" />

        {/* Active Key Path */}
        <div className="flex items-center gap-1.5 overflow-hidden bg-white/4 hover:bg-white/6 border border-white/8 px-3 py-1.5 rounded-xl transition-colors max-w-full shadow-inner shadow-black/10">
          <span className="text-xs text-slate-500 font-mono select-none">/</span>
          <span className="text-xs md:text-sm text-indigo-300 font-mono font-medium truncate max-w-[120px] sm:max-w-[200px] md:max-w-[300px]">
            {pathKey}
          </span>
          <button
            onClick={copyShareUrl}
            title="Copy sharing link"
            className="text-slate-400 hover:text-slate-100 transition-colors p-1 rounded hover:bg-white/6 ml-1.5 flex-shrink-0"
          >
            {copiedUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Status Dot */}
        <div className="flex items-center gap-2 flex-shrink-0 bg-white/4 border border-white/8 px-2.5 py-1 rounded-full shadow-inner shadow-black/10">
          <span className={`w-2 h-2 rounded-full glow-dot ${getStatusColor()}`} />
          <span className="text-[10px] md:text-xs font-semibold text-slate-400">
            {getStatusLabel()}
          </span>
        </div>
      </div>

      {/* Action Buttons & Selectors */}
      <div className="flex items-center justify-end gap-2.5 flex-wrap sm:flex-nowrap">
        {/* Language Dropdown Selector */}
        <div className="relative">
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/4 hover:bg-white/6 border border-white/8 hover:border-white/12 text-xs md:text-sm font-medium text-slate-200 hover:text-white transition-all select-none shadow-inner shadow-black/10"
          >
            <FileCode size={14} className="text-indigo-400" />
            <span className="truncate max-w-[80px] sm:max-w-none">{currentLanguageLabel}</span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
          </button>

          {isLangOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsLangOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-950 border border-white/6 shadow-2xl p-1 z-20 max-h-60 overflow-y-auto">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => {
                      onLanguageChange(lang.value);
                      setIsLangOpen(false);
                      showToast(`Language switched to ${lang.label}`, 'info');
                    }}
                    className={`w-full text-left px-3 py-2 text-xs md:text-sm rounded-md transition-colors flex items-center justify-between ${
                      language === lang.value
                        ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{lang.label}</span>
                    {language === lang.value && <Check size={14} className="text-indigo-400" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-3 py-1 text-[11px] text-slate-200 shadow-inner shadow-black/10">
          <span>{wordCount} words</span>
          <span className="text-slate-700">•</span>
          <span>{lineCount} lines</span>
        </div>

        <button
          onClick={exportAsText}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/4 hover:bg-white/6 border border-white/8 hover:border-white/12 text-xs md:text-sm font-medium text-slate-200 hover:text-white transition-all shadow-inner shadow-black/10"
        >
          <Download size={14} className="text-emerald-400" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Copy All Button */}
        <button
          onClick={copyAllContent}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/4 hover:bg-white/6 border border-white/8 hover:border-white/12 text-xs md:text-sm font-medium text-slate-200 hover:text-white transition-all shadow-inner shadow-black/10"
        >
          {copiedContent ? (
            <>
              <Check size={14} className="text-emerald-400" />
              <span className="hidden sm:inline">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} className="text-indigo-400" />
              <span className="hidden sm:inline">Copy All</span>
            </>
          )}
        </button>

        {/* Explicit Save Button */}
        <button
          onClick={onSave}
          disabled={saveStatus === 'saving'}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-semibold text-xs md:text-sm shadow-md hover:shadow-black/20 active:scale-[0.98] transition-all ${
            saveStatus === 'saving'
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : saveStatus === 'saved'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20'
              : 'bg-white text-slate-950 hover:bg-slate-100 shadow-black/15'
          }`}
        >
          {saveStatus === 'saving' ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <CheckCircle2 size={14} />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save size={14} />
              <span>Save Pad</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
