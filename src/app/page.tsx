'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Key, ShieldAlert, Cpu, Sparkles, RefreshCw, Layers, Clock3, FileText, Code2, NotebookPen } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { getRecentPads } from '@/lib/recentPads';

export default function Home() {
  const router = useRouter();
  const { showToast } = useToast();
  const [padKey, setPadKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentPads, setRecentPads] = useState(() => [] as ReturnType<typeof getRecentPads>);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecentPads(getRecentPads());
  }, []);

  const templates = [
    { name: 'Quick Notes', icon: NotebookPen, language: 'plaintext', description: 'Capture ideas, tasks, and meeting points in seconds.', content: 'Welcome to your new scratchpad.\n\n- Idea\n- Task\n- Next step' },
    { name: 'Code Snippet', icon: Code2, language: 'typescript', description: 'Jump into a polished coding workspace with TypeScript defaults.', content: 'const message = "Hello from ScratchPad";\nconsole.log(message);' },
    { name: 'Draft Doc', icon: FileText, language: 'markdown', description: 'Start a clean document draft for writing or documentation.', content: '# Draft Title\n\nWrite your notes here...' },
  ];

  // Sanitizes inputs to make them safe for URLs
  const sanitizeKey = (key: string) => {
    return key
      .trim()
      .replace(/[^a-zA-Z0-9\-_/]/g, '-') // Replace any invalid URL characters with hyphen
      .replace(/-+/g, '-') // De-duplicate consecutive hyphens
      .replace(/\/+/g, '/'); // De-duplicate consecutive slashes
  };

  const handleGoToPad = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const cleanKey = sanitizeKey(padKey);
    if (!cleanKey || cleanKey === '-' || cleanKey === '/') {
      showToast('Please enter a valid pad name or key', 'error');
      return;
    }

    setIsLoading(true);
    showToast(`Redirecting to /${cleanKey}...`, 'info');
    router.push(`/${cleanKey}`);
  };

  const generateRandomKey = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const handleGenerateRandomKey = () => {
    setIsLoading(true);
    const randomKey = generateRandomKey();
    showToast(`Creating random scratchpad...`, 'info');
    router.push(`/${randomKey}`);
  };

  const handleCreateTemplate = async (template: (typeof templates)[number]) => {
    const randomKey = generateRandomKey();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/pad/${randomKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: template.content, language: template.language }),
      });

      if (!response.ok) throw new Error('Template creation failed');

      showToast(`Opened ${template.name.toLowerCase()} template`, 'success');
      router.push(`/${randomKey}`);
    } catch {
      showToast('Could not create that template right now.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 w-full min-h-screen flex flex-col items-center justify-center px-4 relative overflow-x-hidden bg-[#070b13]">
      {/* Ambient background layers */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.08),_transparent_20%)]" />
      <div className="ambient-orb ambient-orb-one" />
      <div className="ambient-orb ambient-orb-two" />
      <div className="ambient-orb ambient-orb-three" />

      {/* Outer Content Layout Container */}
      <div className="max-w-6xl w-full flex flex-col items-center gap-10 z-10 py-12 px-1 sm:px-0">
        
        {/* Hero Section */}
        <div className="text-center flex flex-col items-center gap-4">
          {/* Decorative pill badge */}
          <div className="inline-flex max-w-full items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/8 bg-white/5 text-xs font-semibold text-slate-200 shadow-sm shadow-black/10 backdrop-blur-md">
            <Sparkles size={12} className="text-indigo-200" />
            <span>Clean, calm, and built for instant sharing</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200 mt-1 select-none leading-tight">
            Scratch<span className="text-indigo-400">Pad</span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl font-medium leading-relaxed break-words px-2 overflow-wrap-anywhere">
            A quiet, no-login workspace for notes, snippets, drafts, and quick sharing across any device.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-200">
            <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1">Fast save</span>
            <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1">Smart templates</span>
            <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1">Minimal layout</span>
          </div>
        </div>

        {/* Input Card Container */}
        <div className="max-w-xl w-full rounded-3xl glass-panel-glow p-6 sm:p-8 animate-slide-in relative border border-white/8 shadow-[0_18px_60px_rgba(0,0,0,0.25)] overflow-hidden">
          <form onSubmit={handleGoToPad} className="flex flex-col gap-4">
            
            {/* Input field */}
            <div className="flex flex-col gap-2">
              <label htmlFor="pad-key-input" className="text-xs font-bold text-indigo-300 uppercase tracking-widest">
                Create or Open Pad Key
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-slate-500 pointer-events-none">
                  <Key size={18} />
                </div>
                <input
                  id="pad-key-input"
                  type="text"
                  placeholder="e.g. my-project-notes or design-draft"
                  value={padKey}
                  onChange={(e) => setPadKey(e.target.value)}
                  disabled={isLoading}
                  autoComplete="off"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-950/85 hover:bg-slate-950 border border-slate-800 focus:border-indigo-300 text-slate-100 placeholder-slate-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400/15 transition-all font-mono text-sm sm:text-base shadow-inner shadow-black/30"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1 break-all">
                Your pad will be accessible at: <span className="text-indigo-400/80">scratchpad.com/{padKey ? sanitizeKey(padKey) : 'your-key'}</span>
              </span>
            </div>

            {/* Submitting buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-slate-200 via-slate-100 to-indigo-100 text-slate-950 font-semibold text-sm sm:text-base active:scale-[0.98] shadow-lg shadow-black/20 transition-all flex items-center justify-center gap-2 hover:brightness-105"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>Go to Pad</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleGenerateRandomKey}
                disabled={isLoading}
                className="py-3.5 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-medium text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 select-none shadow-inner shadow-black/20"
              >
                <span>Random Key</span>
              </button>
            </div>

          </form>
        </div>

        {/* Templates + Recent Pads Section */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 max-w-5xl w-full border-t border-slate-900/60 pt-10">
          <section className="rounded-2xl glass-panel-glow p-5 border border-indigo-500/15 animate-card-rise overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-indigo-300/80">Templates</p>
                <h2 className="text-lg font-semibold text-white">Start with a smart layout</h2>
              </div>
              <Sparkles className="text-indigo-300" size={18} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {templates.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.name}
                    type="button"
                    onClick={() => handleCreateTemplate(template)}
                    disabled={isLoading}
                    className="w-full min-w-0 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500/40 hover:bg-slate-900/80 overflow-hidden"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2 text-indigo-200">
                        <Icon size={16} />
                        <span className="min-w-0 break-words text-sm font-semibold">{template.name}</span>
                      </div>
                      <span className="shrink-0 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-indigo-200">{template.language}</span>
                    </div>
                    <p className="mt-3 text-xs text-slate-400 leading-relaxed break-words whitespace-normal overflow-wrap-anywhere">{template.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section suppressHydrationWarning className="rounded-2xl glass-panel-glow p-5 border border-slate-800/70 animate-card-rise overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Clock3 className="text-emerald-300" size={18} />
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-300/80">Recent</p>
                <h2 className="text-lg font-semibold text-white">Quick reopen</h2>
              </div>
            </div>
            {recentPads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">Open a pad and it will appear here for instant return.</div>
            ) : (
              <div className="space-y-3">
                {recentPads.map((pad) => (
                  <button
                    key={pad.path}
                    type="button"
                    onClick={() => router.push(`/${pad.path}`)}
                    className="w-full min-w-0 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/30 hover:bg-slate-900/80 overflow-hidden"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <span className="min-w-0 break-all text-sm font-semibold text-slate-100">/{pad.path}</span>
                      <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-emerald-200">{pad.language}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400 break-words whitespace-normal overflow-wrap-anywhere">Last opened {new Date(pad.updatedAt).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Feature Grid Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl w-full pt-6">
          
          <div className="flex flex-col gap-2 p-5 rounded-2xl glass-panel hover:bg-slate-900/20 transition-colors border border-slate-900">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldAlert size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-100 mt-2">No Registration</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              No logins, passwords, or emails. Just type a key, write your content, and save. Extreme privacy and speed.
            </p>
          </div>

          <div className="flex flex-col gap-2 p-5 rounded-2xl glass-panel hover:bg-slate-900/20 transition-colors border border-slate-900">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Layers size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-100 mt-2">Cross-Device Sync</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Retrieve your text on any other browser or computer instantly by entering the exact same pad key or URL.
            </p>
          </div>

          <div className="flex flex-col gap-2 p-5 rounded-2xl glass-panel hover:bg-slate-900/20 transition-colors border border-slate-900 sm:col-span-2 md:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Cpu size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-100 mt-2">Developer Friendly</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Equipped with a robust Monaco Editor environment, full syntax highlighting, copy integrations, and atomic save controls.
            </p>
          </div>

        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-600 font-mono select-none">
          ScratchPad &copy; 2026. Premium, fast, persistent.
        </div>

      </div>
    </main>
  );
}
