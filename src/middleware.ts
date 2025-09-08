import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/stripe/webhook',  // Allow Stripe webhooks
  '/api/stripe/price',    // Allow public price check
  '/api/test-webhook',    // Test webhook endpoint
  '/debate',  // Allow access to debate setup page (will handle auth client-side)
  '/debate/(.*)',  // Allow debate pages to load and handle auth client-side
  '/history',  // Allow history page to load and handle auth client-side
])

export default clerkMiddleware(async (auth, req) => {
  // Skip auth in development mode when TEST_MODE is enabled
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_TEST_MODE === 'true') {
    return
  }
  
  // Protect all routes except the public ones
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}