// Skeleton loading components for consistent loading states

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div 
      className={`
        animate-pulse bg-[var(--bg-sunken)] rounded-lg
        ${className}
      `}
      style={style}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className="h-4 w-full" 
          style={{ width: i === lines - 1 ? '75%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  return <Skeleton className={`${sizeClasses[size]} rounded-full`} aria-hidden="true" />;
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div 
      className={`
        p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]/30
        ${className}
      `}
      aria-hidden="true"
    >
      <div className="flex items-start gap-3">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

// Specific skeleton for debate messages
export function SkeletonMessage({ isUser = false }: { isUser?: boolean }) {
  return (
    <div 
      className={`
        py-5 ${!isUser ? 'bg-[var(--bg-elevated)]/60 border-y border-[var(--border)]/30' : ''}
      `}
      aria-hidden="true"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex gap-3">
          <SkeletonAvatar size="md" />
          <div className="flex-1 space-y-2 pt-0.5">
            <Skeleton className="h-4 w-16" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Debate page skeleton with header + messages
export function DebatePageSkeleton() {
  return (
    <div className="min-h-dvh flex flex-col overflow-hidden" aria-hidden="true">
      {/* Header Skeleton */}
      <div className="flex-shrink-0 z-10 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-center gap-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>

      {/* Messages Skeleton */}
      <div className="flex-1 overflow-y-auto min-h-0 py-4 space-y-0">
        <SkeletonMessage isUser={true} />
        <SkeletonMessage />
        <SkeletonMessage isUser={true} />
      </div>

      {/* Input Skeleton */}
      <div className="flex-shrink-0 border-t border-[var(--border)] bg-[var(--bg)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex gap-2">
            <Skeleton className="flex-1 h-12 rounded-xl" />
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="w-10 h-10 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// History page skeleton
export function HistoryPageSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
