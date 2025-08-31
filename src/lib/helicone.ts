/**
 * Shared Helicone headers utility for consistent rate limiting and tracking
 */

export function getHeliconeHeaders(
  userId: string | undefined,
  isPremium: boolean,
  metadata?: {
    character?: string;
    topic?: string;
    debateId?: string;
    turnNumber?: number;
    purpose?: string;
  }
) {
  // Set rate limit based on subscription
  // Premium: $15/month limit (but using free models so no real cost!)
  // Free: $0.10/day as backup to our existing rate limits
  const rateLimitPolicy = isPremium 
    ? "1500;w=2592000;u=cents;s=user"  // $15/month for premium users
    : "10;w=86400;u=cents;s=user";      // $0.10/day for free users (backup)

  const headers: Record<string, string> = {
    'Helicone-Auth': `Bearer ${process.env.HELICONE_API_KEY}`,
    'Helicone-User-Id': userId || 'anonymous',
    'Helicone-RateLimit-Policy': rateLimitPolicy,
  };

  // Add optional metadata for tracking
  if (metadata?.character) {
    headers['Helicone-Property-Character'] = metadata.character;
  }
  if (metadata?.topic) {
    // Limit topic length to avoid header size issues
    headers['Helicone-Property-Topic'] = metadata.topic.substring(0, 100);
  }
  if (metadata?.debateId) {
    headers['Helicone-Property-DebateId'] = metadata.debateId;
  }
  if (metadata?.turnNumber) {
    headers['Helicone-Property-TurnNumber'] = metadata.turnNumber.toString();
  }
  if (metadata?.purpose) {
    headers['Helicone-Property-Purpose'] = metadata.purpose;
  }

  return headers;
}