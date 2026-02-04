'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = { id, message, type, duration };
    
    setToasts((prev) => [...prev, toast]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div 
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 sm:top-6 sm:bottom-auto sm:right-6 sm:left-auto sm:translate-x-0"
      aria-live="polite"
      aria-atomic="true"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));
    
    // Start exit animation before removal
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, (toast.duration || 3000) - 300);
    
    return () => clearTimeout(exitTimer);
  }, [toast.duration]);

  const icon = {
    success: (
      <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }[toast.type];

  const bgColor = {
    success: 'bg-emerald-500/10 border-emerald-500/20',
    error: 'bg-red-500/10 border-red-500/20',
    info: 'bg-[var(--accent)]/10 border-[var(--accent)]/20',
  }[toast.type];

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm
        shadow-lg shadow-black/10
        transition-all duration-300 ease-out
        ${bgColor}
        ${isVisible && !isExiting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      {icon}
      <span className="text-sm font-medium text-[var(--text)]">{toast.message}</span>
    </div>
  );
}
