/// <reference path="../src/env.d.ts" />
import type { SupabaseClient, Session, User } from '@supabase/supabase-js';

declare global {
  namespace App {
    interface Locals {
      session: Session | null;
      user: User | null;
      supabase: SupabaseClient;
      userRole: string | null;
    }
  }
}

import { defineMiddleware } from 'astro:middleware';
import { createServerClient, parseCookieHeader, type CookieOptions } from '@supabase/ssr';
import { db, users } from './db';
import { eq } from 'drizzle-orm';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set');
}

// Route configuration for protected paths
const protectedRoutes: Array<{
  pattern: RegExp;
  requiresAuth: boolean;
  requiredRole?: string | string[];
}> = [
  // Admin routes - require 'admin' role
  { pattern: /^\/admin(\/.*)?$/, requiresAuth: true, requiredRole: 'admin' },
  { pattern: /^\/api\/admin(\/.*)?$/, requiresAuth: true, requiredRole: 'admin' },
  
  // Dashboard and profile - require authentication
  { pattern: /^\/dashboard$/, requiresAuth: true },
  { pattern: /^\/profile(\/.*)?$/, requiresAuth: true },
  
  // Billing API routes - require authentication
  { pattern: /^\/api\/billing(\/.*)?$/, requiresAuth: true },
  { pattern: /^\/api\/profile(\/.*)?$/, requiresAuth: true },
  
  // Forum moderation - require moderator or admin role
  { pattern: /^\/forum\/moderation$/, requiresAuth: true, requiredRole: ['moderator', 'admin'] },
];

// Routes that should bypass authentication entirely
const publicRoutes = [
  /^\/api\/auth\/logout$/,        // Logout endpoint
  /^\/api\/webhooks(\/.*)?$/,     // Webhook endpoints
  /^\/api\/newsletter\/subscribe$/, // Newsletter subscription
  /^\/api\/newsletter\/track(\/.*)?$/, // Newsletter tracking
  /^\/$/,                          // Homepage
  /^\/blog(\/.*)?$/,               // Blog pages
  /^\/videos(\/.*)?$/,             // Video pages
  /^\/snippets(\/.*)?$/,           // Snippet pages
  /^\/forum(?!\/moderation)(\/.*)?$/, // Forum (except moderation)
  /^\/search$/,                    // Search page
  /^\/login$/,                     // Login page
  /^\/register$/,                  // Register page
  /^\/auth(\/.*)?$/,               // Auth callback pages
  /^\/_astro(\/.*)?$/,             // Astro static assets
  /^\/favicon\.ico$/,              // Favicon
];

// Static asset patterns
const staticAssetPatterns = [
  /\.(css|js|jsx?|tsx?|json|svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?|ttf|eot)$/i,
];

function isPublicRoute(pathname: string): boolean {
  // Check static assets
  for (const pattern of staticAssetPatterns) {
    if (pattern.test(pathname)) return true;
  }
  
  // Check explicit public routes
  for (const pattern of publicRoutes) {
    if (pattern.test(pathname)) return true;
  }
  
  return false;
}

function getRouteConfig(pathname: string) {
  for (const route of protectedRoutes) {
    if (route.pattern.test(pathname)) {
      return route;
    }
  }
  return null;
}

async function getUserRole(supabaseUserId: string): Promise<string | null> {
  try {
    const result = await db.select({ role: users.role })
      .from(users)
      .where(eq(users.supabaseUserId, supabaseUserId))
      .limit(1);
    
    return result[0]?.role ?? null;
  } catch {
    return null;
  }
}

function hasRequiredRole(userRole: string | null, requiredRole: string | string[]): boolean {
  if (!userRole) return false;
  
  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return requiredRoles.includes(userRole);
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  
  // Create Supabase server client
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(context.request.headers.get('Cookie') ?? '').map(c => ({
          name: c.name,
          value: c.value ?? '',
        }));
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        for (const cookie of cookiesToSet) {
          context.cookies.set(cookie.name, cookie.value, { ...cookie.options, path: '/' });
        }
      },
    },
  });
  
  // Get the user session using secure server-side validation
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // Store in locals for downstream use
  context.locals.supabase = supabase;
  context.locals.user = user ?? null;
  context.locals.session = null; // Session object available via user
  context.locals.userRole = null;
  
  // Get user role if authenticated
  if (user && !error) {
    context.locals.userRole = await getUserRole(user.id);
  }
  
  // Allow public routes to pass through
  if (isPublicRoute(pathname)) {
    return next();
  }
  
  // Check if route requires protection
  const routeConfig = getRouteConfig(pathname);
  
  if (!routeConfig) {
    // No specific config - allow through
    return next();
  }
  
  // Route requires authentication
  if (routeConfig.requiresAuth) {
    // Check if user is authenticated
    if (!user || error) {
      // Redirect to login with return URL
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      return context.redirect(redirectUrl);
    }
    
    // Check role requirements
    if (routeConfig.requiredRole) {
      if (!hasRequiredRole(context.locals.userRole, routeConfig.requiredRole)) {
        // Return 403 Forbidden
        return new Response(
          JSON.stringify({ 
            error: 'Forbidden', 
            message: 'You do not have permission to access this resource' 
          }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }
  }
  
  return next();
});
