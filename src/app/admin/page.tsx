import { Metadata } from 'next';
import AdminDashboardClient from './AdminDashboardClient';

export const metadata: Metadata = {
  title: 'Admin Dashboard | DebateAI',
  robots: 'noindex, nofollow',
};

export default function AdminPage() {
  return <AdminDashboardClient />;
}
