import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';
import ArtisticBackground from '@/components/backgrounds/ArtisticBackground';
import { websiteJsonLd } from '@/lib/jsonld';
import "./globals.css";

/**
 * Force dynamic rendering for all pages. Prevents static prerendering of
 * pages that depend on ClerkProvider (which needs NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).
 * The /_not-found page is still statically prerendered by Next.js regardless —
 * AuthProvider handles that case by skipping Clerk when the key is missing.
 */
export const dynamic = 'force-dynamic';

/**
 * Wrapper that renders ClerkProvider only when the publishable key is available.
 * During `next build`, static pages like `/_not-found` are prerendered without
 * runtime env vars — ClerkProvider throws if the key is missing.
 * This wrapper lets those pages build without Clerk, while all runtime pages
 * still get full auth.
 */
function AuthProvider({ children }: { children: React.ReactNode }) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!clerkKey) {
    // Build-time prerender (no env vars) — skip Clerk
    return <>{children}</>;
  }
  return <ClerkProvider>{children}</ClerkProvider>;
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://debateai.org';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "DebateAI — Challenge Your Convictions",
    template: "%s | DebateAI",
  },
  description: "Challenge your beliefs against AI trained to argue from every perspective. Sharpen your critical thinking through rigorous intellectual debate.",
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon-32.png',
    apple: '/favicon-512.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'DebateAI',
    title: 'DebateAI — Challenge Your Convictions',
    description: 'Challenge your beliefs against AI trained to argue from every perspective.',
    url: BASE_URL,
    images: [{ url: `${BASE_URL}/api/og`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DebateAI — Challenge Your Convictions',
    description: 'Challenge your beliefs against AI trained to argue from every perspective.',
    images: [`${BASE_URL}/api/og`],
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(websiteJsonLd()),
            }}
          />
          <meta name="theme-color" content="#0c0a09" media="(prefers-color-scheme: dark)" />
          <meta name="theme-color" content="#fafaf9" media="(prefers-color-scheme: light)" />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  const stored = localStorage.getItem('theme');
                  if (stored === 'light' || stored === 'dark') {
                    document.documentElement.classList.add(stored);
                  } else {
                    // Check system preference
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
                  }
                })();
              `,
            }}
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
        >
          <ArtisticBackground />
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <ThemeProvider>
            <ToastProvider>
              <main id="main-content" tabIndex={-1}>
                {children}
              </main>
            </ToastProvider>
          </ThemeProvider>
        </body>
      </html>
    </AuthProvider>
  );
}
