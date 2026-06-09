'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let Icon = Info;
          let iconColor = 'text-blue-400';
          let borderColor = 'border-blue-500/30';
          let glowColor = 'shadow-blue-500/10';

          if (toast.type === 'success') {
            Icon = CheckCircle;
            iconColor = 'text-emerald-400';
            borderColor = 'border-emerald-500/30';
            glowColor = 'shadow-emerald-500/10';
          } else if (toast.type === 'error') {
            Icon = AlertCircle;
            iconColor = 'text-rose-400';
            borderColor = 'border-rose-500/30';
            glowColor = 'shadow-rose-500/10';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl border glass-panel shadow-lg ${borderColor} ${glowColor} animate-slide-in transition-all duration-300`}
              role="alert"
            >
              <div className={`flex-shrink-0 ${iconColor}`}>
                <Icon size={20} className="glow-dot" />
              </div>
              <div className="flex-1 text-sm font-medium text-slate-100">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-white/5"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
