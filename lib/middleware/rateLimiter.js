import { NextResponse } from 'next/server';

// In-memory store for rate limiting (production mein Redis use karo)
const requestStore = new Map();

/**
 * Rate limiter middleware
 * @param {string} identifier - User identifier (email or IP)
 * @param {number} maxRequests - Max requests allowed
 * @param {number} windowMs - Time window in milliseconds
 */
export function checkRateLimit(identifier, maxRequests = 3, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const userRequests = requestStore.get(identifier) || [];

  // Remove expired requests
  const validRequests = userRequests.filter((timestamp) => now - timestamp < windowMs);

  // Check if limit exceeded
  if (validRequests.length >= maxRequests) {
    const oldestRequest = validRequests[0];
    const resetTime = oldestRequest + windowMs;
    const waitTime = Math.ceil((resetTime - now) / 1000 / 60); // minutes

    return {
      allowed: false,
      remainingTime: waitTime,
    };
  }

  // Add current request
  validRequests.push(now);
  requestStore.set(identifier, validRequests);

  return {
    allowed: true,
    remaining: maxRequests - validRequests.length,
  };
}

/**
 * Clear rate limit for a user (after successful operation)
 */
export function clearRateLimit(identifier) {
  requestStore.delete(identifier);
}

/**
 * Cleanup expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [identifier, requests] of requestStore.entries()) {
    const validRequests = requests.filter((timestamp) => now - timestamp < 15 * 60 * 1000);
    if (validRequests.length === 0) {
      requestStore.delete(identifier);
    } else {
      requestStore.set(identifier, validRequests);
    }
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes

/**
 * Rate limit response helper
 */
export function rateLimitResponse(remainingTime) {
  return NextResponse.json(
    {
      success: false,
      message: `Too many requests. Please try again in ${remainingTime} minute${remainingTime > 1 ? 's' : ''}`,
      retryAfter: remainingTime,
    },
    { status: 429 }
  );
}
