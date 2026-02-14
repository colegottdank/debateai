import { Metadata } from 'next';
import ReviewClient from './ReviewClient';

export const metadata: Metadata = {
  title: 'Content Review | Admin | DebateAI',
  robots: 'noindex, nofollow',
};

export default function ReviewPage() {
  return <ReviewClient />;
}
