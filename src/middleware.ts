import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Check if we're in test mode - if so, skip Clerk entirely
const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === 'true'

export default async function middleware(req: NextRequest) {
  // In test mode, allow all requests through without auth
  if (isTestMode) {
    return NextResponse.next()
  }

  // In production mode, use Clerk middleware
  const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server')
  
  const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/stripe/webhook',
    '/api/stripe/price',
    '/api/test-webhook',
    '/debate',
    '/debate/(.*)',
    '/history',
    '/preview',
    '/preview/(.*)',
  ])

  // Use Clerk middleware
  return clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) {
      await auth.protect()
    }
  })(req, {} as any)
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
