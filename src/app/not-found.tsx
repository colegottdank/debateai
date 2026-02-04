import Link from 'next/link';

export const metadata = {
  title: 'Page Not Found | DebateAI',
  description: 'The page you are looking for does not exist.',
};

export default function NotFoundPage() {
  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden">
      {/* Minimal header — no Clerk dependency for static prerender */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <Link href="/" className="text-xl font-bold text-[var(--text)]">
          🧠 DebateAI
        </Link>
      </header>
      
      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="text-center max-w-md">
          {/* 404 Graphic */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-[var(--accent)]/10 mb-4">
              <span className="text-5xl">🤔</span>
            </div>
            <h1 className="text-6xl font-bold text-[var(--text)] mb-2">404</h1>
            <p className="text-lg text-[var(--text-secondary)]">Page not found</p>
          </div>
          
          {/* Message */}
          <div className="mb-8">
            <p className="text-[var(--text-secondary)]">
              The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[var(--accent)] text-white font-medium shadow-lg shadow-[var(--accent)]/25 hover:shadow-xl hover:shadow-[var(--accent)]/40 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              Go Home
            </Link>
            
            <Link
              href="/history"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)] font-medium hover:bg-[var(--bg-sunken)] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              View History
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
