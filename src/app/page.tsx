'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Key, ShieldAlert, Cpu, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function Home() {
  const router = useRouter();
  const { showToast } = useToast();
  const [padKey, setPadKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleGenerateRandomKey = () => {
    setIsLoading(true);
    // Generate secure random alphanumeric key of length 12
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let randomKey = '';
    for (let i = 0; i < 12; i++) {
      randomKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    showToast(`Creating random scratchpad...`, 'info');
    router.push(`/${randomKey}`);
  };

  return (
    <main className="flex-1 w-full min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-[#070b13]">
      {/* Background glowing blurred decorative orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] rounded-full bg-purple-500/10 blur-[150px] pointer-events-none" />

      {/* Outer Content Layout Container */}
      <div className="max-w-4xl w-full flex flex-col items-center gap-12 z-10 py-12">
        
        {/* Hero Section */}
        <div className="text-center flex flex-col items-center gap-4">
          {/* Decorative pill badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-semibold text-indigo-300 shadow-sm shadow-indigo-500/10">
            <Sparkles size={12} className="animate-pulse" />
            <span>Instant Cross-Device Code Sharing</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200 mt-2 select-none">
            Scratch<span className="text-indigo-500">Pad</span>
          </h1>
          
          <p className="text-sm sm:text-lg text-slate-400 max-w-xl font-medium leading-relaxed">
            A temporary, no-login text and code scratchpad. Type any key below to open a blank canvas, write or paste content, and view it instantly on any other device.
          </p>
        </div>

        {/* Input Card Container */}
        <div className="max-w-md w-full rounded-2xl glass-panel-glow p-6 sm:p-8 animate-slide-in relative border border-indigo-500/20">
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
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 placeholder-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm sm:text-base"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1">
                Your pad will be accessible at: <span className="text-indigo-400/80">scratchpad.com/{padKey ? sanitizeKey(padKey) : 'your-key'}</span>
              </span>
            </div>

            {/* Submitting buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-sm sm:text-base active:scale-[0.98] shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
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
                className="py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white font-semibold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 select-none"
              >
                <span>Random Key</span>
              </button>
            </div>

          </form>
        </div>

        {/* Feature Grid Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl w-full border-t border-slate-900/60 pt-10">
          
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
