/**
 * URL Shortener API
 * Create short URLs for easy sharing
 */
import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';

// In-memory storage for MVP (replace with database in production)
// Using a global to persist across requests in development
declare global {
  var urlStore: Map<string, { originalUrl: string; createdAt: Date; clicks: number }>;
}

// Initialize global store if not exists
if (!globalThis.urlStore) {
  globalThis.urlStore = new Map();
}

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { url, customCode } = body as { url?: string; customCode?: string };

    // Validate URL
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate URL format
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL format. Must be http or https' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let code: string;

    if (customCode) {
      // Validate custom code format
      if (!/^[a-zA-Z0-9_-]+$/.test(customCode)) {
        return new Response(JSON.stringify({ 
          error: 'Custom code can only contain letters, numbers, underscores, and hyphens' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Check length
      if (customCode.length > 50) {
        return new Response(JSON.stringify({ error: 'Custom code must be 50 characters or less' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Check if code already exists
      if (globalThis.urlStore.has(customCode)) {
        return new Response(JSON.stringify({ error: 'This code is already in use' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      code = customCode;
    } else {
      // Generate unique code
      do {
        code = nanoid(7);
      } while (globalThis.urlStore.has(code));
    }

    // Store the URL mapping
    globalThis.urlStore.set(code, {
      originalUrl: url,
      createdAt: new Date(),
      clicks: 0,
    });

    // Build short URL
    const siteUrl = import.meta.env.SITE_URL || 'https://imzodev.com';
    const shortUrl = `${siteUrl}/s/${code}`;

    return new Response(JSON.stringify({
      success: true,
      code,
      shortUrl,
      originalUrl: url,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to shorten URL:', error);
    return new Response(JSON.stringify({ error: 'Failed to shorten URL' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const GET: APIRoute = async ({ request, url }) => {
  try {
    // Get URL by code
    const code = url.searchParams.get('code');
    
    if (code) {
      const data = globalThis.urlStore.get(code);
      
      if (!data) {
        return new Response(JSON.stringify({ error: 'URL not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({
        code,
        ...data,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // List all URLs (for debugging - consider removing in production)
    const urls = Array.from(globalThis.urlStore.entries()).map(([code, data]) => ({
      code,
      originalUrl: data.originalUrl,
      createdAt: data.createdAt,
      clicks: data.clicks,
    }));
    
    return new Response(JSON.stringify({ urls, total: urls.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to get URLs:', error);
    return new Response(JSON.stringify({ error: 'Failed to get URLs' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
