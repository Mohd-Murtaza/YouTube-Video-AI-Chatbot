import { NextResponse } from 'next/server';

// Cookie options for access token (24 hours)
export function getAccessTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours in seconds
    path: '/',
  };
}

// Cookie options for refresh token (7 days)
export function getRefreshTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/',
  };
}

// Set auth cookies
export function setAuthCookies(response, accessToken, refreshToken) {
  response.cookies.set('accessToken', accessToken, getAccessTokenCookieOptions());
  response.cookies.set('refreshToken', refreshToken, getRefreshTokenCookieOptions());
  return response;
}

// Clear auth cookies
export function clearAuthCookies(response) {
  response.cookies.delete('accessToken');
  response.cookies.delete('refreshToken');
  return response;
}
