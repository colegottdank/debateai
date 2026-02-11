import { Metadata } from 'next';
import NotificationSettingsClient from './NotificationSettingsClient';

export const metadata: Metadata = {
  title: 'Notification Settings | DebateAI',
  description: 'Manage your notification preferences',
};

export default function NotificationSettingsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="container-narrow py-8">
        <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Notification Settings</h1>
        <p className="text-[var(--text-secondary)] mb-8">
          Choose which notifications you want to receive.
        </p>
        <NotificationSettingsClient />
      </div>
    </div>
  );
}
