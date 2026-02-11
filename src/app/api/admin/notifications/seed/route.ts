import { NextResponse } from 'next/server';
import { createNotificationTables } from '@/lib/notifications';
import { withErrorHandler, errors } from '@/lib/api-errors';

/**
 * POST /api/admin/notifications/seed
 *
 * Creates the notifications and notification_preferences tables.
 * Protected by admin secret or dev mode.
 */
export const POST = withErrorHandler(async (request: Request) => {
  // Simple admin protection
  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET;

  if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
    // Also allow in dev mode
    if (process.env.NODE_ENV !== 'development') {
      throw errors.unauthorized('Admin access required');
    }
  }

  await createNotificationTables();

  return NextResponse.json({
    success: true,
    message: 'Notification tables created successfully',
    tables: ['notifications', 'notification_preferences'],
  });
});
