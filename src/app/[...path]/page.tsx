'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import EditorContainer from '@/components/EditorContainer';
import { useToast } from '@/components/Toast';
import { saveRecentPad } from '@/lib/recentPads';

interface PageProps {
  params: Promise<{
    path: string[];
  }>;
}

export default function PadPage({ params }: PageProps) {
  // In Next.js 15+, dynamic route parameters in Client Components must be unwrapped using React.use()
  const resolvedParams = React.use(params);
  const pathKey = resolvedParams.path.join('/');
  
  const { showToast } = useToast();

  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('plaintext');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use refs to prevent stale closure issues in debounced save triggers
  const contentRef = useRef(content);
  const languageRef = useRef(language);
  const isLoadedRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync refs with state values
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // -------------------------------------------------------------
  // Data Fetching: Retrieve existing pad content
  // -------------------------------------------------------------
  useEffect(() => {
    let active = true;

    async function loadPad() {
      try {
        const response = await fetch(`/api/pad/${pathKey}`);
        if (!response.ok) {
          throw new Error('Failed to load scratchpad');
        }
        const data = await response.json();
        
        if (active) {
          setContent(data.content ?? '');
          setLanguage(data.language ?? 'plaintext');
          setLastSaved(data.last_updated ?? null);
          saveRecentPad(pathKey, data.language ?? 'plaintext');
          setSaveStatus('saved');
          setIsLoading(false);
          
          // Mark loaded so future keystrokes trigger save routines
          setTimeout(() => {
            isLoadedRef.current = true;
          }, 100);
        }
      } catch (error) {
        console.error('Error loading pad:', error);
        if (active) {
          showToast('Failed to connect to database. Using offline cache.', 'error');
          setIsLoading(false);
        }
      }
    }

    loadPad();

    return () => {
      active = false;
      // Clear timers on unmount
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [pathKey, showToast]);

  // -------------------------------------------------------------
  // Core Saving Logic (API Call Wrapper)
  // -------------------------------------------------------------
  const savePadData = useCallback(async (contentToSave: string, languageToSave: string) => {
    setSaveStatus('saving');
    try {
      const response = await fetch(`/api/pad/${pathKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: contentToSave,
          language: languageToSave,
        }),
      });

      if (!response.ok) {
        throw new Error('Save network response failed');
      }

      const data = await response.json();
      saveRecentPad(pathKey, languageToSave);
      setSaveStatus('saved');
      setLastSaved(data.last_updated);
      return true;
    } catch (error) {
      console.error('Error saving scratchpad:', error);
      setSaveStatus('unsaved');
      showToast('Could not save your changes. Connection failure.', 'error');
      return false;
    }
  }, [pathKey, showToast]);

  // -------------------------------------------------------------
  // Trigger Explicit Manual Save
  // -------------------------------------------------------------
  const handleManualSave = useCallback(async () => {
    // Clear any active background debounced saves
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const success = await savePadData(content, language);
    if (success) {
      showToast('Scratchpad saved successfully!', 'success');
    }
  }, [content, language, savePadData, showToast]);

  // -------------------------------------------------------------
  // Keystroke Debounce Auto-Saver Trigger
  // -------------------------------------------------------------
  const triggerDebouncedSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setSaveStatus('unsaved');

    debounceTimerRef.current = setTimeout(async () => {
      // Execute background saving routine
      await savePadData(contentRef.current, languageRef.current);
    }, 1500); // 1.5 seconds debounce
  }, [savePadData]);

  // Handle changes in Editor
  const handleContentChange = (newValue: string) => {
    setContent(newValue);
    if (isLoadedRef.current) {
      triggerDebouncedSave();
    }
  };

  // Handle language switching
  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (isLoadedRef.current) {
      // Switch immediately and trigger save
      setSaveStatus('unsaved');
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      savePadData(contentRef.current, newLang);
    }
  };

  // -------------------------------------------------------------
  // Loading Overlay
  // -------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="w-full h-screen bg-[#070b13] flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <span className="text-sm font-mono tracking-widest text-slate-500 uppercase select-none">
          Loading ScratchPad...
        </span>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Workspace Layout
  // -------------------------------------------------------------
  return (
    <div className="w-full min-h-screen flex flex-col overflow-hidden bg-[linear-gradient(180deg,#070b13_0%,#080d15_45%,#060912_100%)] relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(139,156,255,0.06),_transparent_18%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.06),_transparent_20%)]" />
      <div className="absolute top-10 right-10 h-36 w-36 rounded-full bg-indigo-500/8 blur-3xl" />
      <div className="absolute bottom-8 left-10 h-32 w-32 rounded-full bg-cyan-500/8 blur-3xl" />
      <div className="relative z-10 flex flex-col min-h-screen">
      {/* Premium Header */}
      <Header
        pathKey={pathKey}
        content={content}
        language={language}
        onLanguageChange={handleLanguageChange}
        onSave={handleManualSave}
        saveStatus={saveStatus}
        lastSaved={lastSaved}
      />

      {/* Editor Space */}
      <EditorContainer
        content={content}
        onChange={handleContentChange}
        language={language}
      />
      </div>
    </div>
  );
}
