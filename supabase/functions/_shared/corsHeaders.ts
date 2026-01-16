/**
 * CORS Headers Configuration
 * Restricts API access to authorized domains only
 */

// Get allowed origins from environment or use default
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').filter(Boolean);

// Default allowed origins for development and production
// SECURITY: Only include your actual production domain(s)
const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:8081',
  'https://starpath.app',
  'https://www.starpath.app',
];

const allowedOrigins = ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : DEFAULT_ORIGINS;

/**
 * Get CORS headers based on request origin
 * Only allows requests from whitelisted domains - no wildcards in production
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') || '';
  
  // Strict origin matching - must be in allowlist
  const isAllowed = allowedOrigins.some(allowed => {
    // In development, allow localhost with any port
    if (origin.startsWith('http://localhost:') && allowed.startsWith('http://localhost:')) {
      return true;
    }
    // Exact match for production origins
    return origin === allowed;
  });

  // If not allowed, return first production origin (not localhost)
  const fallbackOrigin = allowedOrigins.find(o => !o.includes('localhost')) || allowedOrigins[0];
  const allowedOrigin = isAllowed ? origin : fallbackOrigin;

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Handle OPTIONS preflight requests
 */
export function handleCorsPreFlight(request: Request): Response {
  return new Response('ok', {
    headers: getCorsHeaders(request),
  });
}
