/**
 * Email service — Resend integration for transactional email.
 *
 * Env vars required:
 *   RESEND_API_KEY   — Resend API key
 *   EMAIL_FROM       — Sender address (e.g. "DebateAI <digest@debateai.org>")
 */

import { Resend } from 'resend';

let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (resendInstance) return resendInstance;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured — email sending disabled');
    return null;
  }

  resendInstance = new Resend(apiKey);
  return resendInstance;
}

const DEFAULT_FROM = process.env.EMAIL_FROM || 'DebateAI <noreply@debateai.org>';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://debateai.org';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  tags?: Array<{ name: string; value: string }>;
}

/**
 * Send a single email via Resend.
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const resend = getResend();
  if (!resend) {
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: DEFAULT_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      tags: options.tags,
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send emails in batch (up to 100 per Resend batch call).
 */
export async function sendBatchEmails(
  emails: Array<{ to: string; subject: string; html: string; tags?: Array<{ name: string; value: string }> }>,
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const resend = getResend();
  if (!resend) {
    return { sent: 0, failed: emails.length, errors: ['Email service not configured'] };
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  // Resend batch API supports up to 100 emails per call
  const batchSize = 100;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);

    try {
      const result = await resend.batch.send(
        batch.map((email) => ({
          from: DEFAULT_FROM,
          to: email.to,
          subject: email.subject,
          html: email.html,
          tags: email.tags,
        })),
      );

      if (result.error) {
        failed += batch.length;
        errors.push(result.error.message);
      } else {
        sent += batch.length;
      }
    } catch (error) {
      failed += batch.length;
      errors.push(error instanceof Error ? error.message : 'Batch send failed');
    }
  }

  return { sent, failed, errors };
}

/**
 * Generate an unsubscribe URL with the user's token.
 */
export function getUnsubscribeUrl(token: string): string {
  return `${BASE_URL}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
}

/**
 * Generate a one-click debate URL for emails.
 */
export function getDebateUrl(topic?: string): string {
  if (topic) {
    return `${BASE_URL}/?topic=${encodeURIComponent(topic)}`;
  }
  return `${BASE_URL}/debate`;
}
