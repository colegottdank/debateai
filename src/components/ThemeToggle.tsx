'use client';

import { useTheme } from '@/components/ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 transition-all duration-200 hover:scale-110 border border-slate-700 flex items-center justify-center"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <svg 
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
          }`} 
          viewBox="0 0 24 24" 
          fill="none"
        >
          <circle cx="12" cy="12" r="5" fill="#D4785A" />
          <g stroke="#D4785A" strokeWidth="2" strokeLinecap="round">
            <path d="M12 1v2m0 18v2" />
            <path d="M23 12h-2M3 12H1" />
            <path d="M20.07 3.93l-1.41 1.41M5.34 18.66l-1.41 1.41" />
            <path d="M20.07 20.07l-1.41-1.41M5.34 5.34L3.93 3.93" />
          </g>
        </svg>
        <svg 
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            theme === 'light' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`} 
          viewBox="0 0 24 24" 
          fill="none"
        >
          <path 
            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" 
            fill="#C15F3C"
            opacity="0.9"
          />
          <circle cx="15" cy="9" r="1" fill="#FAF9F7" opacity="0.6" />
          <circle cx="18" cy="13" r="0.5" fill="#FAF9F7" opacity="0.4" />
          <circle cx="12" cy="11" r="0.75" fill="#FAF9F7" opacity="0.5" />
        </svg>
      </div>
    </button>
  );
}