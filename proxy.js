import { NextResponse } from 'next/server';
import { authMiddleware, shouldHandleAuth } from './middlewares/authMiddleware';

/**
 * Main Proxy Entry Point (Next.js 16+)
 * Next.js 16 renamed "middleware.js" to "proxy.js"
 * 
 * Add more middlewares here as needed (e.g., rateLimit, logging, etc.)
 */
export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Auth Middleware - handles authentication and authorization
  if (shouldHandleAuth(pathname)) {
    return authMiddleware(request);
  }

  // Add more middleware handlers here
  // Example:
  // if (shouldHandleRateLimit(pathname)) {
  //   return rateLimitMiddleware(request);
  // }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/history/:path*',
    '/video/:path*',
    '/login',
    '/register',
  ],
};
