import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook(.*)',
  '/api/stripe/health',  // Allow public health check
  '/api/stripe/price',   // Allow public price check
  '/api/stripe/test',    // Allow public test endpoint
  '/debate/(.*)',  // Allow public access to view specific debates
  '/api/debate/(.*)',  // Allow API access to fetch debate data
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