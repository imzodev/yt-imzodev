import { nanoid } from 'nanoid';
import type { AstroCookies } from 'astro';

const CSRF_COOKIE_NAME = 'csrf_token';

/**
 * Generate a new CSRF token, set it in the cookies, and return it.
 */
export function generateCsrfToken(cookies: AstroCookies): string {
  const token = nanoid(32);
  cookies.set(CSRF_COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: 60 * 60 * 24, // 24 hours
  });
  return token;
}

/**
 * Get the current CSRF token from the cookies.
 * Generates a new one if it doesn't exist.
 */
export function getCsrfToken(cookies: AstroCookies): string {
  const cookie = cookies.get(CSRF_COOKIE_NAME);
  if (cookie?.value) {
    return cookie.value;
  }
  return generateCsrfToken(cookies);
}

/**
 * Validate a CSRF token from a form submission against the cookie token.
 */
export function validateCsrfToken(cookies: AstroCookies, tokenToValidate: string | null): boolean {
  if (!tokenToValidate) return false;
  
  const cookieToken = cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!cookieToken) return false;
  
  return cookieToken === tokenToValidate;
}