/**
 * CORS Headers Configuration
 * Restricts API access to authorized domains
 */

// Get allowed origins from environment or use default
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').filter(Boolean);

// Default allowed origins for development and production
const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://starpath.app',
  'https://www.starpath.app',
];

const allowedOrigins = ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : DEFAULT_ORIGINS;

/**
 * Get CORS headers based on request origin
 * Only allows requests from whitelisted domains
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') || '';
  
  // Check if origin is allowed
  const isAllowed = allowedOrigins.some(allowed => {
    if (allowed === '*') return true;
    if (allowed.endsWith('localhost:5173') || allowed.endsWith('localhost:3000')) {
      return origin.includes('localhost');
    }
    return origin === allowed || origin.endsWith(allowed);
  });

  const allowedOrigin = isAllowed ? origin : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400', // 24 hours
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
