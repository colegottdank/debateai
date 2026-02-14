/**
 * GET /api/email/unsubscribe?token=...
 *
 * One-click unsubscribe (CAN-SPAM compliant).
 * Unsubscribes from ALL emails and returns a confirmation page.
 * No auth required — uses the unsubscribe token for verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeByToken } from '@/lib/email-preferences';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return new NextResponse(unsubscribePage('Missing token', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const result = await unsubscribeByToken(token);

  if (!result.success) {
    return new NextResponse(unsubscribePage('Invalid or expired link', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return new NextResponse(unsubscribePage(result.email || 'your email', true), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}

/**
 * Returns a simple HTML page confirming unsubscribe status.
 */
function unsubscribePage(emailOrError: string, success: boolean): string {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.debateai.org';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? 'Unsubscribed' : 'Error'} | DebateAI</title>
  <style>
    body { margin:0; padding:0; background:#0c0a09; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#fafaf9; display:flex; align-items:center; justify-content:center; min-height:100vh; }
    .card { max-width:400px; text-align:center; padding:40px 24px; }
    .emoji { font-size:48px; margin-bottom:16px; }
    h1 { font-size:24px; font-weight:700; margin:0 0 12px; }
    p { font-size:14px; color:#a8a29e; line-height:1.6; margin:0 0 24px; }
    a.btn { display:inline-block; background:#f59e0b; color:#0c0a09; font-size:14px; font-weight:600; padding:10px 24px; border-radius:10px; text-decoration:none; }
    a.link { color:#f59e0b; text-decoration:underline; font-size:13px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="emoji">${success ? '✅' : '⚠️'}</div>
    <h1>${success ? "You're unsubscribed" : 'Something went wrong'}</h1>
    <p>${success
      ? `We've removed <strong>${emailOrError}</strong> from all DebateAI emails. You won't hear from us again unless you re-subscribe.`
      : emailOrError
    }</p>
    ${success
      ? `<a href="${BASE_URL}" class="btn">Back to DebateAI</a>`
      : `<a href="${BASE_URL}" class="btn">Go to DebateAI</a>`
    }
  </div>
</body>
</html>`;
}
