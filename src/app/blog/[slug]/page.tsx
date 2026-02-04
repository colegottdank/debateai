import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug, getAllPosts } from '@/lib/blog';
import { articleJsonLd } from '@/lib/jsonld';
import Header from '@/components/Header';

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getAllPosts()
    .filter((p) => p.slug !== slug)
    .filter((p) => p.tags.some((t) => post.tags.includes(t)))
    .slice(0, 3);

  return (
    <>
      {/* JSON-LD Article structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            articleJsonLd({
              slug: post.slug,
              title: post.title,
              description: post.description,
              date: post.date,
              author: post.author,
              tags: post.tags,
              image: post.image,
            })
          ),
        }}
      />

      <div className="min-h-dvh flex flex-col">
        <Header />

        <main className="flex-1 px-5 py-8">
          <article className="max-w-3xl mx-auto">
            {/* Back link */}
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-6"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Blog
            </Link>

            {/* Header */}
            <header className="mb-8">
              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-[var(--text)] mb-4 leading-tight">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
                <span>{post.author}</span>
                <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
                <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
                <span>{post.readingTime} min read</span>
              </div>
            </header>

            {/* Content */}
            <div
              className="prose prose-invert max-w-none
                prose-headings:font-serif prose-headings:text-[var(--text)]
                prose-p:text-[var(--text-secondary)] prose-p:leading-7
                prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline
                prose-strong:text-[var(--text)]
                prose-code:text-[var(--accent)] prose-code:bg-[var(--bg-sunken)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                prose-blockquote:border-[var(--accent)] prose-blockquote:text-[var(--text-secondary)]
                prose-li:text-[var(--text-secondary)]
                prose-img:rounded-xl
                prose-hr:border-[var(--border)]"
              dangerouslySetInnerHTML={{ __html: post.html }}
            />

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="mt-12 pt-8 border-t border-[var(--border)]/30">
                <h2 className="text-lg font-semibold text-[var(--text)] mb-4">
                  Related Posts
                </h2>
                <div className="space-y-3">
                  {relatedPosts.map((related) => (
                    <Link
                      key={related.slug}
                      href={`/blog/${related.slug}`}
                      className="block p-4 rounded-xl bg-[var(--bg-elevated)]/50 border border-[var(--border)]/30 hover:border-[var(--accent)]/30 transition-all"
                    >
                      <h3 className="font-medium text-[var(--text)] text-sm mb-1 hover:text-[var(--accent)] transition-colors">
                        {related.title}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
                        {related.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Auto-CTA removed — Echo's posts have contextual inline CTAs */}
          </article>
        </main>
      </div>
    </>
  );
}
