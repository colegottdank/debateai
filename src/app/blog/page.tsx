import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import Header from '@/components/Header';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://debateai.org';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Insights on AI debate, critical thinking, and the art of argumentation. Tips, strategies, and deep dives from the DebateAI team.',
  alternates: {
    canonical: `${BASE_URL}/blog`,
  },
  openGraph: {
    title: 'DebateAI Blog',
    description: 'Insights on AI debate, critical thinking, and the art of argumentation.',
    url: `${BASE_URL}/blog`,
    type: 'website',
  },
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />

      <main className="flex-1 px-5 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="h-px w-6 bg-gradient-to-r from-transparent to-[var(--accent)] opacity-50" />
              <span className="text-[10px] font-medium text-[var(--accent)] uppercase tracking-[0.2em]">
                Blog
              </span>
              <span className="h-px w-6 bg-gradient-to-l from-transparent to-[var(--accent)] opacity-50" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-[var(--text)] mb-3">
              Insights & Ideas
            </h1>
            <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
              Strategies, deep dives, and perspectives on AI debate and critical thinking.
            </p>
          </div>

          {/* Posts */}
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]/30 flex items-center justify-center">
                <span className="text-2xl">✍️</span>
              </div>
              <h3 className="text-base font-medium text-[var(--text)] mb-1">
                Coming soon
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                We&apos;re working on our first posts. Check back soon!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post, index) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block animate-fade-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <article className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--accent)]/0 to-[var(--accent)]/0 group-hover:from-[var(--accent)]/10 group-hover:to-[var(--accent-light)]/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    <div className="relative artistic-card p-5 hover:border-[var(--accent)]/30 transition-all duration-300">
                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <h2 className="text-lg font-semibold text-[var(--text)] mb-1.5 group-hover:text-[var(--accent)] transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">
                        {post.description}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                        <span>{post.author}</span>
                        <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
                        <time dateTime={post.date}>
                          {new Date(post.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </time>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}

          {/* Footer Links */}
          <div className="mt-10 flex items-center justify-center gap-6 text-xs text-[var(--text-secondary)]">
            <Link href="/" className="hover:text-[var(--text)] transition-colors">
              Home
            </Link>
            <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
            <Link href="/debate" className="hover:text-[var(--text)] transition-colors">
              Start a Debate
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
