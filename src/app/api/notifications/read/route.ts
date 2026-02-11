import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-helper';
import { errors, withErrorHandler, validateBody } from '@/lib/api-errors';
import { markAsRead, markAllAsRead } from '@/lib/notifications';
import { z } from 'zod';

const readSchema = z.object({
  id: z.string().min(1).optional(),
  all: z.boolean().optional(),
});

/**
 * PATCH /api/notifications/read
 *
 * Mark notifications as read.
 * Body: { id: "notif-id" } to mark one, or { all: true } to mark all.
 */
export const PATCH = withErrorHandler(async (request: Request) => {
  const userId = await getUserId();
  if (!userId) {
    throw errors.unauthorized();
  }

  const body = await validateBody(request, readSchema);

  if (body.all) {
    await markAllAsRead(userId);
    return NextResponse.json({ success: true, markedAll: true });
  }

  if (body.id) {
    await markAsRead(userId, body.id);
    return NextResponse.json({ success: true, id: body.id });
  }

  throw errors.badRequest('Provide either "id" or "all: true"');
});
