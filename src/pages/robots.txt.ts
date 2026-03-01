import type { APIRoute } from 'astro';

const baseUrl = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';

export const GET: APIRoute = () => {
  const sitemapUrl = new URL('/sitemap.xml', baseUrl).href;

  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${sitemapUrl}`,
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
