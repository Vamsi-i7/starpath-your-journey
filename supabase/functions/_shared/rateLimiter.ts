/**
 * Rate Limiter for Edge Functions
 * Prevents abuse of API endpoints
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// Note: This resets on function cold starts, but provides basic protection
const requestStore = new Map<string, RequestRecord>();

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (user ID, IP, etc.)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number; error?: string } {
  const now = Date.now();
  const record = requestStore.get(identifier);

  // No previous requests or window expired
  if (!record || now > record.resetTime) {
    const newResetTime = now + config.windowMs;
    requestStore.set(identifier, {
      count: 1,
      resetTime: newResetTime,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newResetTime,
    };
  }

  // Within window - check if limit exceeded
  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      error: config.message || `Rate limit exceeded. Try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds.`,
    };
  }

  // Increment count
  record.count++;
  requestStore.set(identifier, record);

  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Cleanup expired entries (run periodically to prevent memory leaks)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, record] of requestStore.entries()) {
    if (now > record.resetTime) {
      requestStore.delete(key);
    }
  }
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  headers: Record<string, string>,
  result: { remaining: number; resetTime: number; allowed: boolean }
): Record<string, string> {
  return {
    ...headers,
    'X-RateLimit-Limit': String(result.remaining + (result.allowed ? 1 : 0)),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  };
}

/**
 * Create rate limit error response
 */
export function createRateLimitResponse(
  error: string,
  resetTime: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: error,
      resetAt: new Date(resetTime).toISOString(),
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000)),
      },
    }
  );
}

// Cleanup expired entries every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
