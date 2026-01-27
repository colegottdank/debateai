'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === 'true';

export function AuthWrapper({ children }: { children: ReactNode }) {
  // In test mode, skip Clerk entirely
  if (isTestMode) {
    return <>{children}</>;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
}
