import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Protected routes that require authentication
const protectedRoutes = ['/history', '/video'];

// Auth routes that authenticated users shouldn't access
const authRoutes = ['/login', '/register'];

/**
 * Authentication Middleware
 * Validates JWT tokens and protects routes
 */
export function authMiddleware(request) {
  const { pathname } = request.nextUrl;
  
  // Get JWT secret - use ACCESS_TOKEN_SECRET (same as login route)
  const jwtSecret = process.env.ACCESS_TOKEN_SECRET;
  
  if (!jwtSecret) {
    console.error('❌ ACCESS_TOKEN_SECRET not available in middleware!');
    return NextResponse.next();
  }
  
  // Get tokens from cookies
  const accessToken = request.cookies.get('accessToken')?.value;

  // Check if route is protected or auth route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Verify access token
  let isAuthenticated = false;
  let userId = null;

  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, jwtSecret);
      isAuthenticated = true;
      userId = decoded.userId;
    } catch (error) {
      console.log('⚠️ Token verification failed:', error.message);
    }
  }

  // If on protected route and not authenticated
  if (isProtectedRoute && !isAuthenticated) {
    // Clear invalid tokens and redirect to home with auth flag
    const homeUrl = new URL('/', request.url);
    homeUrl.searchParams.set('auth', 'required');
    
    const response = NextResponse.redirect(homeUrl);
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    
    return response;
  }

  // If on auth route and already authenticated, redirect to home
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Add user ID to request headers for use in API routes
  const response = NextResponse.next();
  if (isAuthenticated && userId) {
    response.headers.set('x-user-id', userId);
  }

  return response;
}

/**
 * Check if path should be handled by auth middleware
 */
export function shouldHandleAuth(pathname) {
  const allAuthPaths = [...protectedRoutes, ...authRoutes];
  return allAuthPaths.some(route => pathname.startsWith(route));
}
