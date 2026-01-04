import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-secret-key-change-in-production';

/**
 * Decode JWT without verification (to check expiry)
 */
export function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired or will expire soon
 * @param {string} token - JWT token
 * @param {number} bufferSeconds - Expire buffer in seconds (default 60s)
 * @returns {boolean} - true if expired or expiring soon
 */
export function isTokenExpiringSoon(token, bufferSeconds = 60) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  const expiryTime = decoded.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const bufferTime = bufferSeconds * 1000;

  return currentTime >= expiryTime - bufferTime;
}

/**
 * Check if token is completely expired
 */
export function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  return Date.now() >= decoded.exp * 1000;
}

/**
 * Get time until token expires (in seconds)
 */
export function getTokenExpiryTime(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return 0;

  const expiryTime = decoded.exp * 1000;
  const currentTime = Date.now();
  const remainingTime = Math.floor((expiryTime - currentTime) / 1000);

  return Math.max(0, remainingTime);
}
