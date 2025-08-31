import { auth } from '@clerk/nextjs/server';

/**
 * Gets the user ID, supporting test mode in development
 */
export async function getUserId(): Promise<string | null> {
  const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === 'true';
  
  if (isTestMode && process.env.NODE_ENV === 'development') {
    // Use test user ID in test mode
    return 'test-user-123';
  }
  
  // Use real auth
  const authResult = await auth();
  return authResult.userId;
}

/**
 * Gets the user ID or throws an error if not authenticated
 */
export async function requireUserId(): Promise<string> {
  const userId = await getUserId();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }
  
  return userId;
}