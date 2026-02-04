// JSON-LD structured data generators for SEO

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://debateai.org';

/**
 * WebSite schema for the root layout.
 * Helps Google understand the site identity.
 */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DebateAI',
    url: BASE_URL,
    description:
      'Challenge your beliefs against AI trained to argue from every perspective. Sharpen your critical thinking through rigorous intellectual debate.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/debate`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * DiscussionForumPosting schema for individual debate pages.
 * Makes debate content eligible for rich results.
 */
export function debateJsonLd(debate: {
  id: string;
  topic: string;
  opponentName: string;
  messages: Array<{ role: string; content: string }>;
  createdAt?: string;
}) {
  const debateUrl = `${BASE_URL}/debate/${debate.id}`;
  const userMessages = debate.messages.filter((m) => m.role === 'user');
  const aiMessages = debate.messages.filter((m) => m.role === 'ai');

  // Build comment list from the debate messages (up to 20)
  const comments = debate.messages
    .filter((m) => m.role && m.content)
    .slice(0, 20)
    .map((msg, i) => ({
      '@type': 'Comment',
      position: i + 1,
      author: {
        '@type': msg.role === 'user' ? 'Person' : 'Organization',
        name: msg.role === 'user' ? 'Debater' : debate.opponentName,
      },
      text:
        msg.content.length > 500
          ? msg.content.slice(0, 497) + '...'
          : msg.content,
    }));

  return {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: debate.topic,
    url: debateUrl,
    author: {
      '@type': 'Person',
      name: 'Debater',
    },
    datePublished: debate.createdAt || new Date().toISOString(),
    discussionUrl: debateUrl,
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: debate.messages.length,
      },
    ],
    comment: comments.length > 0 ? comments : undefined,
    isPartOf: {
      '@type': 'WebSite',
      name: 'DebateAI',
      url: BASE_URL,
    },
  };
}
