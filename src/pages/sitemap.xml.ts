import type { APIRoute } from 'astro';
import { supabase } from '../lib/supabase';

const baseUrl = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';

const getAbsoluteUrl = (path: string) => new URL(path, baseUrl).href;

export const GET: APIRoute = async () => {
  const staticPages = ['/', '/blog'];

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at, published_at')
    .eq('status', 'published');

  const urls = [
    ...staticPages.map((path) => ({
      loc: getAbsoluteUrl(path),
      lastmod: undefined as string | undefined,
      changefreq: path === '/blog' ? 'daily' : 'weekly',
      priority: path === '/' ? '1.0' : '0.8',
    })),
    ...(posts ?? []).map((post) => ({
      loc: getAbsoluteUrl(`/blog/${post.slug}`),
      lastmod: post.updated_at || post.published_at || undefined,
      changefreq: 'weekly',
      priority: '0.7',
    })),
  ];

  const urlset = urls
    .map(({ loc, lastmod, changefreq, priority }) => {
      const lastmodTag = lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : '';
      return `<url><loc>${loc}</loc>${lastmodTag}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlset}</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
