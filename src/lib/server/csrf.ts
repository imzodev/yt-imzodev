/**
 * CSRF (Cross-Site Request Forgery) Protection Utilities
 */

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_NAME = 'csrf_token';

/**
 * Generate a cryptographically secure random string
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  
  // Use crypto.getRandomValues for browser/Node.js compatibility
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
  } else {
    // Fallback for older environments
    for (let i = 0; i < length; i++) {
      randomValues[i] = Math.floor(Math.random() * chars.length);
    }
  }
  
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  
  return result;
}

/**
 * Get or create a CSRF token for the current session
 * @param cookies Astro cookies object
 * @returns CSRF token string
 */
export function getCsrfToken(cookies: { get: (name: string) => { value: string } | undefined; set: (name: string, value: string, options?: Record<string, unknown>) => void }): string {
  // Try to get existing token
  const existingToken = cookies.get(CSRF_TOKEN_NAME)?.value;
  
  if (existingToken) {
    return existingToken;
  }
  
  // Generate new token
  const newToken = generateRandomString(CSRF_TOKEN_LENGTH);
  
  // Set cookie with appropriate options
  cookies.set(CSRF_TOKEN_NAME, newToken, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
  
  return newToken;
}

/**
 * Validate a CSRF token against the session's token
 * @param cookies Astro cookies object
 * @param token The token from the form submission
 * @returns true if valid, false otherwise
 */
export function validateCsrfToken(
  cookies: { get: (name: string) => { value: string } | undefined },
  token: string | null | undefined
): boolean {
  if (!token) {
    return false;
  }
  
  const sessionToken = cookies.get(CSRF_TOKEN_NAME)?.value;
  
  if (!sessionToken) {
    return false;
  }
  
  // Use timing-safe comparison to prevent timing attacks
  if (sessionToken.length !== token.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < sessionToken.length; i++) {
    result |= sessionToken.charCodeAt(i) ^ token.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Extract CSRF token from FormData
 * @param formData The FormData object
 * @returns The token string or null
 */
export function getCsrfTokenFromFormData(formData: FormData): string | null {
  return formData.get('csrf_token') as string | null;
}
