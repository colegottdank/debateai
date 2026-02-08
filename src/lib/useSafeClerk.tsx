/**
 * Safe Clerk hooks and components that gracefully handle missing ClerkProvider.
 * During build-time prerendering, ClerkProvider may be absent (no env vars),
 * causing the standard hooks/components to throw. These wrappers return safe defaults instead.
 */
'use client';

import React from 'react';
import {
  useUser as useClerkUser,
  useClerk as useClerkClerk,
  SignedIn as ClerkSignedIn,
  SignedOut as ClerkSignedOut,
  SignInButton as ClerkSignInButton,
  UserButton as ClerkUserButton,
} from '@clerk/nextjs';

/**
 * Check if Clerk is available (has publishable key configured)
 */
function isClerkAvailable(): boolean {
  return typeof window !== 'undefined' || !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}

/**
 * Safe wrapper for useUser that returns undefined when Clerk context is missing.
 */
export function useSafeUser() {
  try {
    return useClerkUser();
  } catch {
    // ClerkProvider not available (build-time prerender)
    return { isSignedIn: undefined, isLoaded: false, user: undefined };
  }
}

/**
 * Safe wrapper for useClerk that returns no-op functions when Clerk context is missing.
 */
export function useSafeClerk() {
  try {
    return useClerkClerk();
  } catch {
    // ClerkProvider not available (build-time prerender)
    return {
      openSignIn: () => {},
      openSignUp: () => {},
      openUserProfile: () => {},
      signOut: async () => {},
      loaded: false,
    };
  }
}

/**
 * Safe SignedIn component that renders nothing when Clerk is unavailable.
 */
export function SafeSignedIn({ children }: { children: React.ReactNode }) {
  if (!isClerkAvailable()) {
    return null;
  }
  return <ClerkSignedIn>{children}</ClerkSignedIn>;
}

/**
 * Safe SignedOut component that renders children (as fallback) when Clerk is unavailable.
 */
export function SafeSignedOut({ children }: { children: React.ReactNode }) {
  if (!isClerkAvailable()) {
    return <>{children}</>;
  }
  return <ClerkSignedOut>{children}</ClerkSignedOut>;
}

/**
 * Safe SignInButton that renders a disabled button when Clerk is unavailable.
 */
export function SafeSignInButton({ children, mode }: { children: React.ReactNode; mode?: 'modal' | 'redirect' }) {
  if (!isClerkAvailable()) {
    return <>{children}</>;
  }
  return <ClerkSignInButton mode={mode}>{children}</ClerkSignInButton>;
}

/**
 * Safe UserButton that renders nothing when Clerk is unavailable.
 */
export function SafeUserButton({ appearance }: { appearance?: Record<string, unknown> }) {
  if (!isClerkAvailable()) {
    return null;
  }
  return <ClerkUserButton appearance={appearance} />;
}
