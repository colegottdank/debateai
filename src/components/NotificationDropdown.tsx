'use client';

import Link from 'next/link';

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationDropdownProps {
  notifications: NotificationData[];
  isLoading: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  score_result: '📊',
  streak_warning: '⚠️',
  milestone: '🔥',
  challenge: '⚔️',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return `${Math.floor(diffDay / 7)}w ago`;
}

export default function NotificationDropdown({
  notifications,
  isLoading,
  onMarkRead,
  onMarkAllRead,
  onClose,
}: NotificationDropdownProps) {
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[70vh] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)] shadow-2xl z-[100] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--text)]">Notifications</h3>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <button
              onClick={onMarkAllRead}
              disabled={isLoading}
              className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors disabled:opacity-50"
            >
              Mark all read
            </button>
          )}
          <Link
            href="/settings/notifications"
            onClick={onClose}
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Notification list */}
      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--text-tertiary)]">
            <svg className="w-10 h-10 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const content = (
              <div
                onClick={() => {
                  if (!notif.read) onMarkRead(notif.id);
                  if (notif.link) onClose();
                }}
                className={`flex items-start gap-3 px-4 py-3 border-b border-[var(--border)]/50 cursor-pointer transition-colors hover:bg-[var(--bg-sunken)] ${
                  !notif.read ? 'bg-[var(--accent-subtle)]' : ''
                }`}
              >
                {/* Type icon */}
                <span className="text-lg mt-0.5 shrink-0">{TYPE_ICONS[notif.type] || '🔔'}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!notif.read ? 'font-medium text-[var(--text)]' : 'text-[var(--text-secondary)]'}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5 line-clamp-2">
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                    {timeAgo(notif.createdAt)}
                  </p>
                </div>

                {/* Unread dot */}
                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)] mt-2 shrink-0" />
                )}
              </div>
            );

            if (notif.link) {
              return (
                <Link key={notif.id} href={notif.link} className="block">
                  {content}
                </Link>
              );
            }
            return <div key={notif.id}>{content}</div>;
          })
        )}
      </div>
    </div>
  );
}
